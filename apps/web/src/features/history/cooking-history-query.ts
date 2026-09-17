import {
	COOKING_HISTORY_PAGE_SIZE,
	type CookingHistoryPage,
	CookingHistoryPageSchema,
} from "@flemme/contracts/cooking-history";
import {
	infiniteQueryOptions,
	type QueryClient,
	useInfiniteQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";

export function cookingHistoryQueryKey() {
	return ["cooking", "history"] as const;
}

export async function requestCookingHistoryPage(
	queryClient: QueryClient,
	offset: number,
): Promise<CookingHistoryPage> {
	const search = new URLSearchParams({
		limit: String(COOKING_HISTORY_PAGE_SIZE),
		offset: String(offset),
	});
	const payload: unknown = await requestApi<unknown>(
		`/cooking-sessions/history?${search}`,
		undefined,
		() => handleUnauthorized(queryClient),
	);
	return CookingHistoryPageSchema.parse(payload);
}

export function cookingHistoryQueryOptions(queryClient: QueryClient) {
	return infiniteQueryOptions({
		queryKey: cookingHistoryQueryKey(),
		queryFn: ({ pageParam }) =>
			requestCookingHistoryPage(queryClient, pageParam),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
		staleTime: 0,
		refetchOnMount: "always",
		retry: false,
	});
}

export function invalidateCookingHistory(queryClient: QueryClient) {
	return queryClient.invalidateQueries({
		queryKey: cookingHistoryQueryKey(),
		exact: true,
	});
}

export function useCookingHistory() {
	const queryClient = useQueryClient();
	return useInfiniteQuery(cookingHistoryQueryOptions(queryClient));
}
