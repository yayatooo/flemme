import {
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { requestApi } from "@/api/api-client";
import { handleUnauthorized, signOut } from "@/auth/auth-actions";
import { authQueryKey, type CurrentUser } from "@/auth/auth-query";
import {
	type HouseholdState,
	householdQueryKey,
	saveHouseholdState,
} from "@/onboarding/household-query";
import {
	type ProfileState,
	profileQueryKey,
	saveProfileState,
} from "@/onboarding/profile-query";

interface CurrentUserResponse {
	user: CurrentUser;
}

export async function updateDisplayName(
	queryClient: QueryClient,
	name: string,
) {
	const response = await requestApi<CurrentUserResponse>(
		"/auth/me",
		{ method: "PATCH", body: JSON.stringify({ name }) },
		() => handleUnauthorized(queryClient),
	);
	queryClient.setQueryData(authQueryKey, response.user);
	return response.user;
}

export async function savePreferences(
	queryClient: QueryClient,
	profile: ProfileState,
) {
	const saved = await saveProfileState(queryClient, profile);
	queryClient.setQueryData(profileQueryKey, saved);
	return saved;
}

export async function saveHousehold(
	queryClient: QueryClient,
	household: HouseholdState,
) {
	const saved = await saveHouseholdState(queryClient, household);
	queryClient.setQueryData(householdQueryKey, saved);
	return saved;
}

export function useUpdateDisplayNameMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (name: string) => updateDisplayName(queryClient, name),
	});
}

export function useSavePreferencesMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (profile: ProfileState) =>
			savePreferences(queryClient, profile),
	});
}

export function useSaveHouseholdMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (household: HouseholdState) =>
			saveHousehold(queryClient, household),
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => signOut(queryClient),
	});
}

export function nameMutationErrorMessage() {
	return "Couldn't update your name. Your previous name is still saved.";
}

export function preferenceMutationErrorMessage() {
	return "Couldn't save your preferences. Your selections are still here—try again.";
}

export function householdMutationErrorMessage() {
	return "Couldn't save your household. Your changes are still here—try again.";
}
