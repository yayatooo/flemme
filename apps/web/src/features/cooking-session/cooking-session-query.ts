import type { CookingRecommendationOutput } from "@flemme/agent/cooking-recommendation-output";
import {
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
	CreateCookingSessionRequestSchema,
} from "@flemme/contracts/cooking-session";
import {
	type QueryClient,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import type { PreCookingHandoff } from "@/features/pre-cooking/pre-cooking-query";

type RecommendationSnapshot = Extract<
	CookingRecommendationOutput,
	{ type: "recommendations" }
>;

export interface CookingSessionCreationInput {
	handoff: PreCookingHandoff;
	recommendationSnapshot: RecommendationSnapshot;
}

export type CookingSessionCreationState =
	| { status: "pending"; input: CookingSessionCreationInput }
	| {
			status: "error";
			input: CookingSessionCreationInput;
			message: string;
	  }
	| {
			status: "success";
			input: CookingSessionCreationInput;
			sessionId: string;
	  };

export const cookingSessionCreationQueryKey = [
	"cooking",
	"session-creation",
] as const;
const cookingSessionCreationMutationKey = [
	"cooking",
	"create-session",
] as const;

export function cookingSessionQueryKey(sessionId: string) {
	return ["cooking", "sessions", sessionId] as const;
}

export const cookingSessionCreationQueryOptions = queryOptions({
	queryKey: cookingSessionCreationQueryKey,
	queryFn: async (): Promise<CookingSessionCreationState | null> => null,
	enabled: false,
	gcTime: Number.POSITIVE_INFINITY,
	staleTime: Number.POSITIVE_INFINITY,
});

export function buildCreateCookingSessionRequest({
	handoff,
	recommendationSnapshot,
}: CookingSessionCreationInput): CreateCookingSessionRequest {
	if (
		!recommendationSnapshot.recommendations.includes(handoff.selectedRecipe)
	) {
		throw new Error(
			"Selected recipe must belong to its Recommendation snapshot",
		);
	}
	const firstStage = handoff.plan.cookingStages[0];
	const firstStep = firstStage?.steps[0];
	if (!firstStage || !firstStep) {
		throw new Error("Cooking plan must contain an initial cooking position");
	}
	const request = {
		recommendationSnapshot,
		selectedRecipeSnapshot: handoff.selectedRecipe,
		cookingPlan: handoff.plan,
		session: {
			status: "active",
			currentStageId: firstStage.id,
			currentStepId: firstStep.id,
			completedStepIds: [],
			changes: [],
		},
	} as const satisfies CreateCookingSessionRequest;
	if (!CreateCookingSessionRequestSchema.safeParse(request).success) {
		throw new Error(
			"Cooking Session request does not match the shared contract",
		);
	}
	return request;
}

export function cookingSessionCreationErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError && error.status === 0) {
		return "Unable to reach Flemme. Check your connection and try again.";
	}
	return "Couldn't start your cooking session. Your plan is still here.";
}

export function cookingSessionReadErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Check your connection and try again.";
		}
		if (error.status === 400) return "This cooking session link is invalid.";
		if (error.status === 403) {
			return "You don't have access to this cooking session.";
		}
		if (error.status === 404) return "This cooking session was not found.";
		if (error.code === "INVALID_PERSISTED_SNAPSHOT") {
			return "This cooking session could not be restored safely.";
		}
	}
	return "Flemme couldn't load this cooking session. Try again in a moment.";
}

export async function requestCookingSessionCreation(
	queryClient: QueryClient,
	input: CookingSessionCreationInput,
) {
	const payload: unknown = await requestApi<unknown>(
		"/cooking-sessions",
		{
			method: "POST",
			body: JSON.stringify(buildCreateCookingSessionRequest(input)),
		},
		() => handleUnauthorized(queryClient),
	);
	return CookingSessionResponseSchema.parse(payload);
}

export async function fetchCookingSession(
	queryClient: QueryClient,
	sessionId: string,
) {
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/${encodeURIComponent(sessionId)}`,
		undefined,
		() => handleUnauthorized(queryClient),
	);
	return CookingSessionResponseSchema.parse(payload);
}

export function cookingSessionQueryOptions(
	queryClient: QueryClient,
	sessionId: string,
) {
	return queryOptions({
		queryKey: cookingSessionQueryKey(sessionId),
		staleTime: 30_000,
		queryFn: () => fetchCookingSession(queryClient, sessionId),
		retry: false,
	});
}

export function beginCookingSessionCreation(
	queryClient: QueryClient,
	input: CookingSessionCreationInput,
) {
	const current = queryClient.getQueryData<CookingSessionCreationState>(
		cookingSessionCreationQueryKey,
	);
	if (current?.status === "pending") return null;
	if (
		current?.status === "success" &&
		current.input.handoff.request === input.handoff.request &&
		current.input.handoff.selectedRecipe === input.handoff.selectedRecipe &&
		current.input.handoff.plan === input.handoff.plan
	) {
		return null;
	}
	queryClient.setQueryData(cookingSessionCreationQueryKey, {
		status: "pending",
		input,
	} satisfies CookingSessionCreationState);
	return input;
}

export async function executeCookingSessionCreation(
	queryClient: QueryClient,
	input: CookingSessionCreationInput,
) {
	try {
		const session = await requestCookingSessionCreation(queryClient, input);
		const current = queryClient.getQueryData<CookingSessionCreationState>(
			cookingSessionCreationQueryKey,
		);
		if (current?.input === input) {
			queryClient.setQueryData(cookingSessionQueryKey(session.id), session);
			queryClient.setQueryData(cookingSessionCreationQueryKey, {
				status: "success",
				input,
				sessionId: session.id,
			} satisfies CookingSessionCreationState);
		}
		return session;
	} catch (error) {
		const current = queryClient.getQueryData<CookingSessionCreationState>(
			cookingSessionCreationQueryKey,
		);
		if (current?.input === input) {
			queryClient.setQueryData(cookingSessionCreationQueryKey, {
				status: "error",
				input,
				message: cookingSessionCreationErrorMessage(error),
			} satisfies CookingSessionCreationState);
		}
		throw error;
	}
}

export function useCookingSession(sessionId: string) {
	const queryClient = useQueryClient();
	return useQuery(cookingSessionQueryOptions(queryClient, sessionId));
}

export function useCreateCookingSessionMutation() {
	const queryClient = useQueryClient();
	const state = useQuery(cookingSessionCreationQueryOptions).data;
	const mutation = useMutation({
		mutationKey: cookingSessionCreationMutationKey,
		mutationFn: (input: CookingSessionCreationInput) =>
			executeCookingSessionCreation(queryClient, input),
	});

	function submit(input: CookingSessionCreationInput) {
		const pendingInput = beginCookingSessionCreation(queryClient, input);
		return pendingInput ? mutation.mutateAsync(pendingInput) : null;
	}

	return {
		state,
		isPending: state?.status === "pending" || mutation.isPending,
		submit,
	};
}
