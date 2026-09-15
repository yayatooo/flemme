import type { KitchenEquipmentKey } from "@flemme/contracts";
import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "./onboarding-query";

export interface KitchenState {
	equipment: KitchenEquipmentKey[];
}

export const kitchenQueryKey = ["kitchen"] as const;
export const onboardingDecisionQueryKey = ["onboarding", "decision"] as const;
export const emptyKitchen: KitchenState = { equipment: [] };

export function isMissingKitchenError(error: unknown): error is FlemmeApiError {
	return (
		error instanceof FlemmeApiError &&
		error.status === 404 &&
		error.code === "KITCHEN_NOT_FOUND"
	);
}

export function toggleEquipment(
	equipment: ReadonlyArray<KitchenEquipmentKey>,
	key: KitchenEquipmentKey,
): KitchenEquipmentKey[] {
	return equipment.includes(key)
		? equipment.filter((existing) => existing !== key)
		: [...equipment, key];
}

export function kitchenStateKey(kitchen: KitchenState): string {
	return kitchen.equipment.join(":");
}

export function kitchenErrorMessage(error: unknown): string {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Please check your network and try again.";
		}
		if (error.status >= 400 && error.status < 500) return error.message;
		return "Couldn't save your kitchen equipment. Please try again.";
	}
	return "Unexpected error while loading your kitchen equipment.";
}

export function kitchenQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: kitchenQueryKey,
		queryFn: async (): Promise<KitchenState | null> => {
			try {
				return await requestApi<KitchenState>("/kitchen", undefined, () =>
					handleUnauthorized(queryClient),
				);
			} catch (error) {
				if (isMissingKitchenError(error)) return null;
				throw error;
			}
		},
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export async function saveKitchenAndResolveNext(
	queryClient: QueryClient,
	payload: KitchenState,
	currentPath: string,
): Promise<string> {
	const saved = await requestApi<KitchenState>(
		"/kitchen",
		{ method: "PUT", body: JSON.stringify(payload) },
		() => handleUnauthorized(queryClient),
	);
	queryClient.setQueryData(kitchenQueryKey, saved);
	await queryClient.invalidateQueries({ queryKey: onboardingDecisionQueryKey });
	const decision = await queryClient.fetchQuery(
		onboardingQueryOptions(queryClient),
	);
	return resolveOnboardingRedirect(decision, currentPath, "kitchen") ?? "/app";
}
