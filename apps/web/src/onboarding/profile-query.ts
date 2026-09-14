import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../onboarding/onboarding-query";

export interface ProfileState {
	foodPreferences: string[];
	cookingPreferences: string[];
}

export interface PreferenceOption {
	value: string;
	label: string;
}

export const profileQueryKey = ["profile"] as const;
export const onboardingDecisionQueryKey = ["onboarding", "decision"] as const;

export const foodPreferenceOptions = [
	{ value: "indonesian", label: "Indonesian" },
	{ value: "asian", label: "Asian" },
	{ value: "western", label: "Western" },
	{ value: "savory", label: "Savory" },
	{ value: "spicy", label: "Spicy" },
	{ value: "sweet", label: "Sweet" },
] as const satisfies ReadonlyArray<PreferenceOption>;

export const cookingPreferenceOptions = [
	{ value: "quick", label: "Quick" },
	{ value: "simple", label: "Simple" },
	{ value: "one-pan", label: "One-pan" },
	{ value: "low-effort", label: "Low effort" },
	{ value: "fried", label: "Fried" },
	{ value: "grilled", label: "Grilled" },
] as const satisfies ReadonlyArray<PreferenceOption>;

export const emptyProfile: ProfileState = {
	foodPreferences: [],
	cookingPreferences: [],
};

export function isMissingProfileError(error: unknown): error is FlemmeApiError {
	return (
		error instanceof FlemmeApiError &&
		error.status === 404 &&
		error.code === "PROFILE_NOT_FOUND"
	);
}

export function togglePreferenceValue(
	values: ReadonlyArray<string>,
	value: string,
): string[] {
	return values.includes(value)
		? values.filter((existing) => existing !== value)
		: [...values, value];
}

export function preferenceOptionsWithPersistedValues(
	options: ReadonlyArray<PreferenceOption>,
	persistedValues: ReadonlyArray<string>,
): PreferenceOption[] {
	const result = [...options];
	for (const value of persistedValues) {
		if (!options.some((option) => option.value === value)) {
			result.push({ value, label: value });
		}
	}
	return result;
}

export function buildProfilePayload(
	foodPreferences: string[],
	cookingPreferences: string[],
): ProfileState {
	return { foodPreferences, cookingPreferences };
}

export function profileStateKey(state: ProfileState): string {
	return `${state.foodPreferences.join("\u0000")}::${state.cookingPreferences.join("\u0000")}`;
}

export function profileErrorMessage(error: unknown): string {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Please check your network and try again.";
		}
		if (error.status >= 400 && error.status < 500) return error.message;
		return "Flemme is unavailable. Please try again.";
	}
	return "Unexpected error while loading your profile preferences.";
}

export function profileQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: profileQueryKey,
		queryFn: async (): Promise<ProfileState | null> => {
			try {
				return await requestApi<ProfileState>("/profile", undefined, () =>
					handleUnauthorized(queryClient),
				);
			} catch (error) {
				if (isMissingProfileError(error)) return null;
				throw error;
			}
		},
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export async function saveProfileState(
	queryClient: QueryClient,
	payload: ProfileState,
) {
	return requestApi<ProfileState>(
		"/profile",
		{ method: "PUT", body: JSON.stringify(payload) },
		() => handleUnauthorized(queryClient),
	);
}

export async function saveProfileAndResolveNext(
	queryClient: QueryClient,
	payload: ProfileState,
	currentPath: string,
): Promise<string> {
	const saved = await saveProfileState(queryClient, payload);
	queryClient.setQueryData(profileQueryKey, saved);
	await queryClient.invalidateQueries({ queryKey: onboardingDecisionQueryKey });
	const decision = await queryClient.fetchQuery(
		onboardingQueryOptions(queryClient),
	);
	return resolveOnboardingRedirect(decision, currentPath, "profile") ?? "/app";
}
