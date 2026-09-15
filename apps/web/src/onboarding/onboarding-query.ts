import {
	type QueryClient,
	queryOptions,
	useQuery,
} from "@tanstack/react-query";
import { requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";

export type OnboardingStep =
	| "profile"
	| "household"
	| "kitchen"
	| "inventory"
	| "complete";
export type OnboardingRoute = OnboardingStep | "onboarding" | "app";

const onboardingStepPaths: Record<
	OnboardingStep,
	| "/onboarding/profile"
	| "/onboarding/household"
	| "/onboarding/kitchen"
	| "/onboarding/inventory"
	| "/onboarding/complete"
> = {
	profile: "/onboarding/profile",
	household: "/onboarding/household",
	kitchen: "/onboarding/kitchen",
	inventory: "/onboarding/inventory",
	complete: "/onboarding/complete",
};

export interface OnboardingDecision {
	completed: boolean;
	completedAt: string | null;
	nextStep: OnboardingStep | null;
}

export function onboardingStepPath(step: OnboardingStep) {
	return onboardingStepPaths[step];
}

export function resolveOnboardingRedirect(
	query: Pick<OnboardingDecision, "completed" | "nextStep">,
	currentPath: string,
	route: OnboardingRoute,
): string | null {
	if (route === "app") {
		if (query.completed || !query.nextStep) return null;
		const target = onboardingStepPath(query.nextStep);
		return currentPath === target ? null : target;
	}

	if (query.completed || !query.nextStep) {
		return currentPath === "/app" ? null : "/app";
	}
	const target = onboardingStepPath(query.nextStep);
	return currentPath === target ? null : target;
}

export function onboardingQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: ["onboarding", "decision"] as const,
		queryFn: () =>
			requestApi<OnboardingDecision>("/onboarding", undefined, () =>
				handleUnauthorized(queryClient),
			),
		retry: false,
	});
}

export function useOnboardingDecision(queryClient: QueryClient) {
	return useQuery(onboardingQueryOptions(queryClient));
}
