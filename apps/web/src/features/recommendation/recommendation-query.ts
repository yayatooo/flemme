import {
	type CookingRecommendation,
	type CookingRecommendationOutput,
	CookingRecommendationOutputSchema,
} from "@flemme/agent/cooking-recommendation-output";
import {
	type QueryClient,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";

export type RecommendationFlowState =
	| { status: "loading"; request: string }
	| {
			status: "success";
			request: string;
			result: CookingRecommendationOutput;
	  }
	| { status: "error"; request: string; message: string };

export interface RecommendationSelection {
	request: string;
	selectedRecipe: CookingRecommendation;
}

export const recommendationFlowQueryKey = [
	"cooking",
	"recommendation-flow",
] as const;
export const recommendationSelectionQueryKey = [
	"cooking",
	"selected-recommendation",
] as const;
const recommendationMutationKey = [
	"cooking",
	"recommendation-request",
] as const;

export const recommendationFlowQueryOptions = queryOptions({
	queryKey: recommendationFlowQueryKey,
	queryFn: async (): Promise<RecommendationFlowState | null> => null,
	enabled: false,
	gcTime: Number.POSITIVE_INFINITY,
	staleTime: Number.POSITIVE_INFINITY,
});

export const recommendationSelectionQueryOptions = queryOptions({
	queryKey: recommendationSelectionQueryKey,
	queryFn: async (): Promise<RecommendationSelection | null> => null,
	enabled: false,
	gcTime: Number.POSITIVE_INFINITY,
	staleTime: Number.POSITIVE_INFINITY,
});

export function buildRecommendationRequest(request: string) {
	const normalizedRequest = request.trim();
	if (!normalizedRequest) {
		throw new Error("Recommendation request must not be empty");
	}
	return { session: { request: normalizedRequest } };
}

export function recommendationErrorMessage(error: unknown) {
	if (error && typeof error === "object" && "status" in error) {
		const status = error.status;
		if (status === 0) {
			return "Unable to reach Flemme. Check your connection and try again.";
		}
		if (status === 422) {
			return "Your saved cooking context is incomplete. Check your kitchen and try again.";
		}
		if (status === 503) {
			return "Recommendations are unavailable right now. Try again shortly.";
		}
	}
	return "Flemme couldn't prepare recommendations. Try again in a moment.";
}

export function beginRecommendation(queryClient: QueryClient, request: string) {
	const normalizedRequest = request.trim();
	if (!normalizedRequest) return null;
	const current = queryClient.getQueryData<RecommendationFlowState>(
		recommendationFlowQueryKey,
	);
	if (current?.status === "loading") return null;

	queryClient.setQueryData(recommendationFlowQueryKey, {
		status: "loading",
		request: normalizedRequest,
	} satisfies RecommendationFlowState);
	queryClient.removeQueries({ queryKey: recommendationSelectionQueryKey });
	return normalizedRequest;
}

export async function requestCookingRecommendation(
	queryClient: QueryClient,
	request: string,
) {
	const payload: unknown = await requestApi<unknown>(
		"/cooking/recommendations",
		{
			method: "POST",
			body: JSON.stringify(buildRecommendationRequest(request)),
		},
		() => handleUnauthorized(queryClient),
	);
	return CookingRecommendationOutputSchema.parse(payload);
}

export async function executeRecommendation(
	queryClient: QueryClient,
	request: string,
) {
	try {
		const result = await requestCookingRecommendation(queryClient, request);
		queryClient.setQueryData(recommendationFlowQueryKey, {
			status: "success",
			request,
			result,
		} satisfies RecommendationFlowState);
		return result;
	} catch (error) {
		queryClient.setQueryData(recommendationFlowQueryKey, {
			status: "error",
			request,
			message: recommendationErrorMessage(error),
		} satisfies RecommendationFlowState);
		throw error;
	}
}

export function appendClarificationResponse(request: string, answer: string) {
	const normalizedAnswer = answer.trim();
	if (!normalizedAnswer) return request;
	return `${request}\n\nAdditional detail: ${normalizedAnswer}`;
}

export function preserveSelectedRecommendation(
	queryClient: QueryClient,
	request: string,
	selectedRecipe: CookingRecommendation,
) {
	const selection = { request, selectedRecipe };
	queryClient.setQueryData(
		recommendationSelectionQueryKey,
		selection satisfies RecommendationSelection,
	);
	return selection;
}

export function useRecommendationFlow() {
	return useQuery(recommendationFlowQueryOptions);
}

export function useRecommendationSelection() {
	return useQuery(recommendationSelectionQueryOptions);
}

export function useRecommendationMutation() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationKey: recommendationMutationKey,
		mutationFn: (request: string) =>
			executeRecommendation(queryClient, request),
	});

	function submit(request: string) {
		const normalizedRequest = beginRecommendation(queryClient, request);
		return normalizedRequest ? mutation.mutateAsync(normalizedRequest) : null;
	}

	return { isPending: mutation.isPending, submit };
}
