import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
} from "@flemme/contracts/cooking-session";
import type { RecipeNutritionResult } from "@flemme/nutrition/recipe-nutrition";
import {
	type QueryClient,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";

export function nutritionQueryKey(sessionId: string) {
	return ["cooking", "sessions", sessionId, "nutrition"] as const;
}

export async function requestNutrition(
	queryClient: QueryClient,
	sessionId: string,
): Promise<RecipeNutritionResult> {
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/${encodeURIComponent(sessionId)}/nutrition`,
		{ method: "POST" },
		() => handleUnauthorized(queryClient),
	);
	const session = CookingSessionResponseSchema.parse(payload);
	if (session.session.status !== "completed" || !session.nutritionSnapshot) {
		throw new Error("Nutrition response is missing its canonical snapshot");
	}
	queryClient.setQueryData(cookingSessionQueryKey(sessionId), session);
	return session.nutritionSnapshot;
}

export function restoreOrRequestNutrition(
	queryClient: QueryClient,
	sessionId: string,
	session: CookingSessionResponse | undefined,
) {
	return session?.nutritionSnapshot ?? requestNutrition(queryClient, sessionId);
}

export function nutritionErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Your completed cooking session and Completion review are safe.";
		}
		if (error.status === 409) {
			return "This cooking session is not ready for Nutrition review.";
		}
	}
	return "Flemme couldn't calculate this Nutrition review. Your completed session is safe, so you can retry.";
}

export function useNutrition(
	sessionId: string,
	session: CookingSessionResponse | undefined,
) {
	const queryClient = useQueryClient();
	return useQuery({
		queryKey: nutritionQueryKey(sessionId),
		queryFn: () => restoreOrRequestNutrition(queryClient, sessionId, session),
		enabled:
			session?.session.status === "completed" &&
			Boolean(session.completionSnapshot),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	});
}
