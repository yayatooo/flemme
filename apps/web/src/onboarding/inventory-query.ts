import {
	normalizeIngredientName,
	productionIngredientCatalog,
} from "@flemme/ingredients";
import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "./onboarding-query";

export interface InventoryItemState {
	id: string;
	ingredientKey: string | null;
	name: string;
	quantity: number | null;
	unit: string | null;
	isApproximate: boolean;
	condition: "fresh" | "use_soon" | "unknown";
}

export interface InventoryState {
	items: InventoryItemState[];
}

export interface PendingInventoryItem {
	identity: string;
	name: string;
}

export const inventoryQueryKey = ["inventory"] as const;
export const onboardingDecisionQueryKey = ["onboarding", "decision"] as const;
export const emptyInventory: InventoryState = { items: [] };

export const ingredientSuggestions = [
	"Egg",
	"Raw white rice",
	"Garlic",
	"Shallot",
	"Tomato",
	"Potato",
] as const;

export function isMissingInventoryError(
	error: unknown,
): error is FlemmeApiError {
	return (
		error instanceof FlemmeApiError &&
		error.status === 404 &&
		error.code === "INVENTORY_NOT_FOUND"
	);
}

export function pendingInventoryItem(
	name: string,
): PendingInventoryItem | null {
	const normalizedName = name.trim().replace(/\s+/gu, " ");
	if (normalizedName.length === 0) return null;
	const ingredient = productionIngredientCatalog.resolveName(normalizedName);
	return {
		identity: ingredient?.key ?? normalizeIngredientName(normalizedName),
		name: normalizedName,
	};
}

export function addPendingInventoryItem(
	items: ReadonlyArray<PendingInventoryItem>,
	name: string,
): { items: PendingInventoryItem[]; duplicate: boolean } {
	const item = pendingInventoryItem(name);
	if (!item) return { items: [...items], duplicate: false };
	if (items.some((existing) => existing.identity === item.identity)) {
		return { items: [...items], duplicate: true };
	}
	return { items: [...items, item], duplicate: false };
}

export function inventoryStateKey(inventory: InventoryState): string {
	return inventory.items.map(({ id }) => id).join(":");
}

export function inventoryErrorMessage(error: unknown): string {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Please check your network and try again.";
		}
		if (error.status >= 400 && error.status < 500) return error.message;
		return "Couldn't save your ingredients. Your selections are still here.";
	}
	return "Unexpected error while loading your inventory.";
}

export function inventoryQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: inventoryQueryKey,
		queryFn: async (): Promise<InventoryState | null> => {
			try {
				return await requestApi<InventoryState>("/inventory", undefined, () =>
					handleUnauthorized(queryClient),
				);
			} catch (error) {
				if (isMissingInventoryError(error)) return null;
				throw error;
			}
		},
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

async function completeInventoryOnboarding(
	queryClient: QueryClient,
	request: () => Promise<InventoryState>,
): Promise<string> {
	const inventory = await request();
	queryClient.setQueryData(inventoryQueryKey, inventory);
	await queryClient.invalidateQueries({ queryKey: onboardingDecisionQueryKey });
	const decision = await queryClient.fetchQuery(
		onboardingQueryOptions(queryClient),
	);
	return (
		resolveOnboardingRedirect(decision, "/onboarding/inventory", "inventory") ??
		"/app"
	);
}

export function saveInitialInventory(
	queryClient: QueryClient,
	items: ReadonlyArray<PendingInventoryItem>,
): Promise<string> {
	return completeInventoryOnboarding(queryClient, () =>
		requestApi<InventoryState>(
			"/inventory/items",
			{
				method: "PUT",
				body: JSON.stringify({ items: items.map(({ name }) => ({ name })) }),
			},
			() => handleUnauthorized(queryClient),
		),
	);
}

export function addInventoryLater(queryClient: QueryClient): Promise<string> {
	return completeInventoryOnboarding(queryClient, () =>
		requestApi<InventoryState>("/inventory", { method: "PUT" }, () =>
			handleUnauthorized(queryClient),
		),
	);
}
