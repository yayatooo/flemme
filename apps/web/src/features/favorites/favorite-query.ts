import {
	FAVORITES_PAGE_SIZE,
	type FavoriteResponse,
	type FavoritesResponse,
	FavoritesResponseSchema,
} from "@flemme/contracts/favorite";
import {
	infiniteQueryOptions,
	type QueryClient,
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";

export function favoritesQueryKey() {
	return ["favorites"] as const;
}

export function favoriteBySessionQueryKey(sessionId: string) {
	return [...favoritesQueryKey(), "session", sessionId] as const;
}

async function requestFavorites(
	queryClient: QueryClient,
	search: URLSearchParams,
): Promise<FavoritesResponse> {
	const payload: unknown = await requestApi<unknown>(
		`/favorites?${search}`,
		undefined,
		() => handleUnauthorized(queryClient),
	);
	const favorites = FavoritesResponseSchema.parse(payload);
	for (const favorite of favorites.items) {
		queryClient.setQueryData(
			favoriteBySessionQueryKey(favorite.cookingSessionId),
			favorite,
		);
	}
	return favorites;
}

export function requestFavoritesPage(
	queryClient: QueryClient,
	offset: number,
): Promise<FavoritesResponse> {
	return requestFavorites(
		queryClient,
		new URLSearchParams({
			limit: String(FAVORITES_PAGE_SIZE),
			offset: String(offset),
		}),
	);
}

export function favoritesQueryOptions(queryClient: QueryClient) {
	return infiniteQueryOptions({
		queryKey: favoritesQueryKey(),
		queryFn: ({ pageParam }) => requestFavoritesPage(queryClient, pageParam),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
		staleTime: 0,
		refetchOnMount: "always",
		retry: false,
	});
}

export async function requestFavoriteBySession(
	queryClient: QueryClient,
	sessionId: string,
): Promise<FavoriteResponse | null> {
	const favorites = await requestFavorites(
		queryClient,
		new URLSearchParams({
			limit: "1",
			offset: "0",
			cookingSessionId: sessionId,
		}),
	);
	const favorite = favorites.items[0] ?? null;
	queryClient.setQueryData(favoriteBySessionQueryKey(sessionId), favorite);
	return favorite;
}

export function useFavorites() {
	const queryClient = useQueryClient();
	return useInfiniteQuery(favoritesQueryOptions(queryClient));
}

export function useFavoriteBySession(sessionId: string) {
	const queryClient = useQueryClient();
	return useQuery({
		queryKey: favoriteBySessionQueryKey(sessionId),
		queryFn: () => requestFavoriteBySession(queryClient, sessionId),
		staleTime: 30_000,
		retry: false,
	});
}
