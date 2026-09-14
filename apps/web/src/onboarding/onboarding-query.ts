import {
	type QueryClient,
	queryOptions,
	useQuery,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";

const resources = [
	{
		name: "Profile",
		path: "/profile",
		missingCode: "PROFILE_NOT_FOUND",
		step: "profile",
	},
	{
		name: "Household",
		path: "/household",
		missingCode: "HOUSEHOLD_NOT_FOUND",
		step: "household",
	},
	{
		name: "Kitchen",
		path: "/kitchen",
		missingCode: "KITCHEN_NOT_FOUND",
		step: "kitchen",
	},
	{
		name: "Inventory",
		path: "/inventory",
		missingCode: "INVENTORY_NOT_FOUND",
		step: "inventory",
	},
] as const;

export type OnboardingStep = (typeof resources)[number]["step"];
export type OnboardingResourceName = (typeof resources)[number]["name"];
export type OnboardingRoute = OnboardingStep | "onboarding" | "app";

const onboardingStepPaths: Record<
	OnboardingStep,
	| "/onboarding/profile"
	| "/onboarding/household"
	| "/onboarding/kitchen"
	| "/onboarding/inventory"
> = {
	profile: "/onboarding/profile",
	household: "/onboarding/household",
	kitchen: "/onboarding/kitchen",
	inventory: "/onboarding/inventory",
};

export interface OnboardingDecision {
	required: boolean;
	missing: Array<OnboardingResourceName>;
	nextStep: OnboardingStep | null;
}

type ResourceState = OnboardingResourceName | null;

export function onboardingStepPath(step: OnboardingStep) {
	return onboardingStepPaths[step];
}

export function resolveOnboardingRedirect(
	query: Pick<OnboardingDecision, "required" | "nextStep">,
	currentPath: string,
	route: OnboardingRoute,
): string | null {
	if (route === "app") {
		if (!query.required || !query.nextStep) {
			return null;
		}
		const target = onboardingStepPath(query.nextStep);
		return currentPath === target ? null : target;
	}

	if (route === "onboarding") {
		if (!query.required) {
			return currentPath === "/app" ? null : "/app";
		}
		if (!query.nextStep) {
			return currentPath === "/app" ? null : "/app";
		}
		const target = onboardingStepPath(query.nextStep);
		return currentPath === target ? null : target;
	}

	if (!query.required || !query.nextStep) {
		return currentPath === "/app" ? null : "/app";
	}
	if (query.nextStep === route) {
		return currentPath === onboardingStepPath(route)
			? null
			: onboardingStepPath(route);
	}
	return onboardingStepPath(query.nextStep);
}

export function deriveOnboardingDecision(
	missing: ReadonlyArray<ResourceState>,
): Pick<OnboardingDecision, "missing" | "nextStep" | "required"> {
	const missingNames = resources
		.map((resource, index) => (missing[index] === null ? null : resource.name))
		.filter((name): name is OnboardingResourceName => name !== null);
	let nextStep: OnboardingStep | null = null;
	const firstMissingIndex = missing.findIndex((status) => status !== null);
	if (firstMissingIndex !== -1) {
		nextStep = resources[firstMissingIndex].step;
	}
	return {
		missing: missingNames,
		nextStep,
		required: missingNames.length > 0,
	};
}

async function inspectResource(
	queryClient: QueryClient,
	resource: (typeof resources)[number],
) {
	try {
		await requestApi<unknown>(resource.path, undefined, () =>
			handleUnauthorized(queryClient),
		);
		return null;
	} catch (error) {
		if (
			error instanceof FlemmeApiError &&
			error.status === 404 &&
			error.code === resource.missingCode
		) {
			return resource.name;
		}
		throw error;
	}
}

export function onboardingQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: ["onboarding", "decision"] as const,
		queryFn: async (): Promise<OnboardingDecision> => {
			const states = await Promise.all(
				resources.map((resource) => inspectResource(queryClient, resource)),
			);
			return deriveOnboardingDecision(states);
		},
		retry: false,
	});
}

export function useOnboardingDecision(queryClient: QueryClient) {
	return useQuery(onboardingQueryOptions(queryClient));
}
