import {
	CreateFavoriteSchema,
	type FavoriteResponse,
	FavoriteResponseSchema,
	type FavoritesResponse,
} from "@flemme/contracts/favorite";
import {
	type InfiniteData,
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import { invalidateCookingHistory } from "@/features/history/cooking-history-query";
import {
	favoriteBySessionQueryKey,
	favoritesQueryKey,
	requestFavoriteBySession,
} from "./favorite-query";

const pendingCreates = new WeakMap<
	QueryClient,
	Map<string, Promise<FavoriteResponse>>
>();
const pendingDeletes = new WeakMap<QueryClient, Map<string, Promise<void>>>();

function synchronizeCreatedFavorite(
	queryClient: QueryClient,
	favorite: FavoriteResponse,
) {
	queryClient.setQueryData(
		favoriteBySessionQueryKey(favorite.cookingSessionId),
		favorite,
	);
	void queryClient.invalidateQueries({
		queryKey: favoritesQueryKey(),
		exact: true,
	});
	void invalidateCookingHistory(queryClient);
}

function synchronizeDeletedFavorite(
	queryClient: QueryClient,
	favorite: FavoriteResponse,
) {
	queryClient.setQueryData(
		favoriteBySessionQueryKey(favorite.cookingSessionId),
		null,
	);
	queryClient.setQueryData<InfiniteData<FavoritesResponse, number>>(
		favoritesQueryKey(),
		(current) =>
			current
				? {
						...current,
						pages: current.pages.map((page) => ({
							...page,
							items: page.items.filter((item) => item.id !== favorite.id),
						})),
					}
				: current,
	);
	void queryClient.invalidateQueries({
		queryKey: favoritesQueryKey(),
		exact: true,
	});
	void invalidateCookingHistory(queryClient);
}

async function createFavoriteRequest(
	queryClient: QueryClient,
	sessionId: string,
): Promise<FavoriteResponse> {
	try {
		const body = CreateFavoriteSchema.parse({ cookingSessionId: sessionId });
		const payload: unknown = await requestApi<unknown>(
			"/favorites",
			{ method: "POST", body: JSON.stringify(body) },
			() => handleUnauthorized(queryClient),
		);
		return FavoriteResponseSchema.parse(payload);
	} catch (error) {
		if (
			error instanceof FlemmeApiError &&
			error.status === 409 &&
			error.code === "FAVORITE_ALREADY_EXISTS"
		) {
			const existing = await requestFavoriteBySession(queryClient, sessionId);
			if (existing) return existing;
		}
		throw error;
	}
}

async function deleteFavoriteRequest(
	queryClient: QueryClient,
	favoriteId: string,
) {
	try {
		await requestApi<undefined>(
			`/favorites/${encodeURIComponent(favoriteId)}`,
			{ method: "DELETE" },
			() => handleUnauthorized(queryClient),
		);
	} catch (error) {
		if (error instanceof FlemmeApiError && error.status === 404) return;
		throw error;
	}
}

export function executeCreateFavorite(
	queryClient: QueryClient,
	sessionId: string,
): Promise<FavoriteResponse> {
	let clientCreates = pendingCreates.get(queryClient);
	if (!clientCreates) {
		clientCreates = new Map();
		pendingCreates.set(queryClient, clientCreates);
	}
	const pending = clientCreates.get(sessionId);
	if (pending) return pending;

	const request = createFavoriteRequest(queryClient, sessionId)
		.then((favorite) => {
			synchronizeCreatedFavorite(queryClient, favorite);
			return favorite;
		})
		.finally(() => clientCreates?.delete(sessionId));
	clientCreates.set(sessionId, request);
	return request;
}

export function executeDeleteFavorite(
	queryClient: QueryClient,
	favorite: FavoriteResponse,
): Promise<void> {
	let clientDeletes = pendingDeletes.get(queryClient);
	if (!clientDeletes) {
		clientDeletes = new Map();
		pendingDeletes.set(queryClient, clientDeletes);
	}
	const pending = clientDeletes.get(favorite.id);
	if (pending) return pending;

	const request = deleteFavoriteRequest(queryClient, favorite.id)
		.then(() => synchronizeDeletedFavorite(queryClient, favorite))
		.finally(() => clientDeletes?.delete(favorite.id));
	clientDeletes.set(favorite.id, request);
	return request;
}

export function favoriteMutationErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Your completed meal and Nutrition review are safe.";
		}
		if (error.status === 403 || error.status === 404) {
			return "This completed cooking session is no longer available to save.";
		}
		if (error.status === 409) {
			return "This cooking session is not eligible to be saved as a favorite.";
		}
	}
	return "Flemme couldn't save this favorite. Your completed meal and Nutrition review are safe.";
}

export function favoriteDeleteErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. This favorite is still saved.";
		}
		if (error.status === 403) {
			return "This favorite is no longer available to remove.";
		}
	}
	return "Flemme couldn't remove this favorite. Try again.";
}

export function useCreateFavoriteMutation(sessionId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...favoriteBySessionQueryKey(sessionId), "create"],
		mutationFn: () => executeCreateFavorite(queryClient, sessionId),
	});
}

export function useDeleteFavoriteMutation(favorite: FavoriteResponse) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...favoritesQueryKey(), favorite.id, "delete"],
		mutationFn: () => executeDeleteFavorite(queryClient, favorite),
	});
}
