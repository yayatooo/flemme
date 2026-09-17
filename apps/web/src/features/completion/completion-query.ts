import type { CompletionOutput } from "@flemme/agent/completion-output";
import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
} from "@flemme/contracts/cooking-session";
import {
	type QueryClient,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";
import { invalidateCookingHistory } from "@/features/history/cooking-history-query";

export function completionQueryKey(sessionId: string) {
	return ["cooking", "sessions", sessionId, "completion"] as const;
}

export async function requestCompletion(
	queryClient: QueryClient,
	sessionId: string,
): Promise<CompletionOutput> {
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/${encodeURIComponent(sessionId)}/completion`,
		{
			method: "POST",
			body: JSON.stringify({}),
		},
		() => handleUnauthorized(queryClient),
	);
	const session = CookingSessionResponseSchema.parse(payload);
	if (session.session.status !== "completed" || !session.completionSnapshot) {
		throw new Error("Completion response is missing canonical output");
	}
	queryClient.setQueryData(cookingSessionQueryKey(sessionId), session);
	void invalidateCookingHistory(queryClient);
	return session.completionSnapshot;
}

export function restoreOrRequestCompletion(
	queryClient: QueryClient,
	sessionId: string,
	session: CookingSessionResponse | undefined,
) {
	return (
		session?.completionSnapshot ?? requestCompletion(queryClient, sessionId)
	);
}

export function completionErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Your completed cooking session is safe.";
		}
		if (error.status === 409) {
			return "This cooking session is not ready for Completion review.";
		}
	}
	return "Flemme couldn't prepare your Completion review. Your completed session is safe, so you can retry.";
}

export function useCompletion(
	sessionId: string,
	session: CookingSessionResponse | undefined,
) {
	const queryClient = useQueryClient();
	return useQuery({
		queryKey: completionQueryKey(sessionId),
		queryFn: () => restoreOrRequestCompletion(queryClient, sessionId, session),
		enabled: session?.session.status === "completed",
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});
}
