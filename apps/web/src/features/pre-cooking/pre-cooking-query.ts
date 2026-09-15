import {
	type PreCookingOutput,
	PreCookingOutputSchema,
} from "@flemme/agent/pre-cooking-output";
import {
	type QueryClient,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import {
	type RecommendationFlowState,
	type RecommendationSelection,
	recommendationFlowQueryKey,
	recommendationSelectionQueryKey,
} from "@/features/recommendation/recommendation-query";

export type PreCookingFlowState =
	| { status: "loading"; selection: RecommendationSelection }
	| {
			status: "success";
			selection: RecommendationSelection;
			plan: PreCookingOutput;
	  }
	| {
			status: "error";
			selection: RecommendationSelection;
			message: string;
	  };

export interface PreCookingHandoff {
	request: string;
	selectedRecipe: RecommendationSelection["selectedRecipe"];
	plan: PreCookingOutput;
}

export const preCookingFlowQueryKey = [
	...recommendationSelectionQueryKey,
	"pre-cooking-plan",
] as const;
export const preCookingHandoffQueryKey = [
	...recommendationSelectionQueryKey,
	"pre-cooking-handoff",
] as const;
const preCookingMutationKey = [
	...recommendationSelectionQueryKey,
	"generate-pre-cooking-plan",
] as const;

export const preCookingFlowQueryOptions = queryOptions({
	queryKey: preCookingFlowQueryKey,
	queryFn: async (): Promise<PreCookingFlowState | null> => null,
	enabled: false,
	gcTime: Number.POSITIVE_INFINITY,
	staleTime: Number.POSITIVE_INFINITY,
});

export const preCookingHandoffQueryOptions = queryOptions({
	queryKey: preCookingHandoffQueryKey,
	queryFn: async (): Promise<PreCookingHandoff | null> => null,
	enabled: false,
	gcTime: Number.POSITIVE_INFINITY,
	staleTime: Number.POSITIVE_INFINITY,
});

export function buildPreCookingRequest(selection: RecommendationSelection) {
	const request = selection.request.trim();
	if (!request) throw new Error("Pre-cooking request must not be empty");
	return {
		selectedRecipe: selection.selectedRecipe,
		session: { request },
	};
}

export function preCookingErrorMessage(error: unknown) {
	if (error && typeof error === "object" && "status" in error) {
		const status = error.status;
		if (status === 0) {
			return "Unable to reach Flemme. Check your connection and try again.";
		}
		if (status === 422) {
			return "Your saved cooking context is incomplete. Check your kitchen and try again.";
		}
		if (status === 503) {
			return "Cooking plans are unavailable right now. Try again shortly.";
		}
	}
	return "Flemme couldn't prepare your cooking plan. Try again in a moment.";
}

export async function requestPreCookingPlan(
	queryClient: QueryClient,
	selection: RecommendationSelection,
) {
	const payload: unknown = await requestApi<unknown>(
		"/cooking/pre-cooking",
		{
			method: "POST",
			body: JSON.stringify(buildPreCookingRequest(selection)),
		},
		() => handleUnauthorized(queryClient),
	);
	return PreCookingOutputSchema.parse(payload);
}

export function beginPreCooking(
	queryClient: QueryClient,
	selection: RecommendationSelection,
) {
	const current = queryClient.getQueryData<PreCookingFlowState>(
		preCookingFlowQueryKey,
	);
	if (
		current &&
		(current.status === "loading" || current.status === "success") &&
		current.selection.request === selection.request &&
		current.selection.selectedRecipe === selection.selectedRecipe
	) {
		return null;
	}

	queryClient.setQueryData(preCookingFlowQueryKey, {
		status: "loading",
		selection,
	} satisfies PreCookingFlowState);
	queryClient.removeQueries({
		queryKey: preCookingHandoffQueryKey,
		exact: true,
	});
	return selection;
}

export async function executePreCooking(
	queryClient: QueryClient,
	selection: RecommendationSelection,
) {
	try {
		const plan = await requestPreCookingPlan(queryClient, selection);
		const current = queryClient.getQueryData<PreCookingFlowState>(
			preCookingFlowQueryKey,
		);
		if (current?.selection === selection) {
			const successfulFlow = {
				status: "success",
				selection,
				plan,
			} satisfies PreCookingFlowState;
			queryClient.setQueryData(preCookingFlowQueryKey, successfulFlow);
			preservePreCookingHandoff(queryClient, successfulFlow);
		}
		return plan;
	} catch (error) {
		const current = queryClient.getQueryData<PreCookingFlowState>(
			preCookingFlowQueryKey,
		);
		if (current?.selection === selection) {
			queryClient.setQueryData(preCookingFlowQueryKey, {
				status: "error",
				selection,
				message: preCookingErrorMessage(error),
			} satisfies PreCookingFlowState);
		}
		throw error;
	}
}

export function preservePreCookingHandoff(
	queryClient: QueryClient,
	flow: Extract<PreCookingFlowState, { status: "success" }>,
) {
	const handoff = {
		request: flow.selection.request,
		selectedRecipe: flow.selection.selectedRecipe,
		plan: flow.plan,
	} satisfies PreCookingHandoff;
	queryClient.setQueryData(preCookingHandoffQueryKey, handoff);
	return handoff;
}

export function resolvePreCookingEntry(queryClient: QueryClient) {
	const selection = queryClient.getQueryData<RecommendationSelection>(
		recommendationSelectionQueryKey,
	);
	const flow = queryClient.getQueryData<PreCookingFlowState>(
		preCookingFlowQueryKey,
	);
	if (
		selection &&
		flow &&
		flow.selection.request === selection.request &&
		flow.selection.selectedRecipe === selection.selectedRecipe
	) {
		return null;
	}
	const recommendation = queryClient.getQueryData<RecommendationFlowState>(
		recommendationFlowQueryKey,
	);
	return recommendation ? "/app/recommendation" : "/app";
}

export function usePreCookingFlow() {
	return useQuery(preCookingFlowQueryOptions);
}

export function usePreCookingHandoff() {
	return useQuery(preCookingHandoffQueryOptions);
}

export function usePreCookingMutation() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationKey: preCookingMutationKey,
		mutationFn: (selection: RecommendationSelection) =>
			executePreCooking(queryClient, selection),
	});

	function submit(selection: RecommendationSelection) {
		const pendingSelection = beginPreCooking(queryClient, selection);
		return pendingSelection ? mutation.mutateAsync(pendingSelection) : null;
	}

	return { isPending: mutation.isPending, submit };
}
