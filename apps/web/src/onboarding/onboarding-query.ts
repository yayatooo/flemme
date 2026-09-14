import {
	type QueryClient,
	queryOptions,
	useQuery,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "../api/api-client";
import { handleUnauthorized } from "../auth/auth-actions";

const resources = [
	{ name: "Profile", path: "/profile", missingCode: "PROFILE_NOT_FOUND" },
	{ name: "Household", path: "/household", missingCode: "HOUSEHOLD_NOT_FOUND" },
	{ name: "Kitchen", path: "/kitchen", missingCode: "KITCHEN_NOT_FOUND" },
	{ name: "Inventory", path: "/inventory", missingCode: "INVENTORY_NOT_FOUND" },
] as const;

export interface OnboardingDecision {
	required: boolean;
	missing: Array<(typeof resources)[number]["name"]>;
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
			const missing = states.filter((name) => name !== null);
			return { required: missing.length > 0, missing };
		},
		retry: false,
	});
}

export function useOnboardingDecision(queryClient: QueryClient) {
	return useQuery(onboardingQueryOptions(queryClient));
}
