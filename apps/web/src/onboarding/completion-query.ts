import type { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";
import {
	type OnboardingDecision,
	onboardingQueryOptions,
	onboardingStepPath,
} from "./onboarding-query";

export async function completeOnboarding(queryClient: QueryClient) {
	try {
		const status = await requestApi<OnboardingDecision>(
			"/onboarding/complete",
			{ method: "POST" },
			() => handleUnauthorized(queryClient),
		);
		queryClient.setQueryData(
			onboardingQueryOptions(queryClient).queryKey,
			status,
		);
		return "/app" as const;
	} catch (error) {
		if (
			error instanceof FlemmeApiError &&
			error.code === "ONBOARDING_INCOMPLETE"
		) {
			await queryClient.invalidateQueries({
				queryKey: onboardingQueryOptions(queryClient).queryKey,
			});
			const status = await queryClient.fetchQuery(
				onboardingQueryOptions(queryClient),
			);
			if (status.nextStep && status.nextStep !== "complete") {
				return onboardingStepPath(status.nextStep);
			}
		}
		throw error;
	}
}

export function completionErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError && error.status === 0) {
		return "Couldn't finish setup. Your information has already been saved. Check your connection and try again.";
	}
	return "Couldn't finish setup. Your information has already been saved. Please try again.";
}
