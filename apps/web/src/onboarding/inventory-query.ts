import type { InventoryResponse } from "@flemme/contracts/inventory";
import { InventoryResponseSchema } from "@flemme/contracts/inventory";
import {
	normalizeIngredientName,
	productionIngredientCatalog,
} from "@flemme/ingredients";
import type { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";
import {
	emptyInventory,
	inventoryQueryKey,
	inventoryQueryOptions,
} from "../features/inventory/inventory-query";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "./onboarding-query";
export type InventoryState = InventoryResponse;
export type InventoryItemState = InventoryResponse["items"][number];

export { emptyInventory, inventoryQueryKey, inventoryQueryOptions };

export interface PendingInventoryItem {
	identity: string;
	name: string;
}

export const onboardingDecisionQueryKey = ["onboarding", "decision"] as const;

export const ingredientSuggestions = [
	"Egg",
	"Raw white rice",
	"Garlic",
	"Shallot",
	"Tomato",
	"Potato",
] as const;

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

async function completeInventoryOnboarding(
	queryClient: QueryClient,
	request: () => Promise<InventoryResponse>,
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
		requestApi<unknown>(
			"/inventory/items",
			{
				method: "PUT",
				body: JSON.stringify({ items: items.map(({ name }) => ({ name })) }),
			},
			() => handleUnauthorized(queryClient),
		).then((payload) => InventoryResponseSchema.parse(payload)),
	);
}

export function addInventoryLater(queryClient: QueryClient): Promise<string> {
	return completeInventoryOnboarding(queryClient, () =>
		requestApi<unknown>("/inventory", { method: "PUT" }, () =>
			handleUnauthorized(queryClient),
		).then((payload) => InventoryResponseSchema.parse(payload)),
	);
}
