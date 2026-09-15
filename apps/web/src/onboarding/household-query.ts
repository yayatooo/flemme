import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "./onboarding-query";

export interface HouseholdState {
	adults: number;
	children: number;
	toddlers: number;
}

export type HouseholdCategory = keyof HouseholdState;

export const householdQueryKey = ["household"] as const;
export const onboardingDecisionQueryKey = ["onboarding", "decision"] as const;
export const defaultHousehold: HouseholdState = {
	adults: 1,
	children: 0,
	toddlers: 0,
};
export const MAX_HOUSEHOLD_COUNT = 20;

export function isMissingHouseholdError(
	error: unknown,
): error is FlemmeApiError {
	return (
		error instanceof FlemmeApiError &&
		error.status === 404 &&
		error.code === "HOUSEHOLD_NOT_FOUND"
	);
}

export function updateHouseholdCount(
	household: HouseholdState,
	category: HouseholdCategory,
	delta: -1 | 1,
): HouseholdState {
	return {
		...household,
		[category]: Math.min(
			MAX_HOUSEHOLD_COUNT,
			Math.max(0, household[category] + delta),
		),
	};
}

export function householdMemberCount(household: HouseholdState): number {
	return household.adults + household.children + household.toddlers;
}

export function householdStateKey(household: HouseholdState): string {
	return `${household.adults}:${household.children}:${household.toddlers}`;
}

export function householdErrorMessage(error: unknown): string {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Please check your network and try again.";
		}
		if (error.status >= 400 && error.status < 500) return error.message;
		return "Couldn't save your household. Please try again.";
	}
	return "Unexpected error while loading your household.";
}

export function householdQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: householdQueryKey,
		queryFn: async (): Promise<HouseholdState | null> => {
			try {
				return await requestApi<HouseholdState>("/household", undefined, () =>
					handleUnauthorized(queryClient),
				);
			} catch (error) {
				if (isMissingHouseholdError(error)) return null;
				throw error;
			}
		},
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export async function saveHouseholdAndResolveNext(
	queryClient: QueryClient,
	payload: HouseholdState,
	currentPath: string,
): Promise<string> {
	const saved = await requestApi<HouseholdState>(
		"/household",
		{ method: "PUT", body: JSON.stringify(payload) },
		() => handleUnauthorized(queryClient),
	);
	queryClient.setQueryData(householdQueryKey, saved);
	await queryClient.invalidateQueries({ queryKey: onboardingDecisionQueryKey });
	const decision = await queryClient.fetchQuery(
		onboardingQueryOptions(queryClient),
	);
	return (
		resolveOnboardingRedirect(decision, currentPath, "household") ?? "/app"
	);
}
