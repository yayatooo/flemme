import { afterEach, expect, test } from "bun:test";
import type {
	FavoriteResponse,
	FavoritesResponse,
} from "@flemme/contracts/favorite";
import { QueryClient } from "@tanstack/react-query";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";
import { cookingHistoryQueryKey } from "@/features/history/cooking-history-query";
import {
	executeCreateFavorite,
	executeDeleteFavorite,
	favoriteDeleteErrorMessage,
	favoriteMutationErrorMessage,
} from "./favorite-mutations";
import {
	favoriteBySessionQueryKey,
	favoritesQueryKey,
	requestFavoriteBySession,
	requestFavoritesPage,
} from "./favorite-query";

const originalFetch = globalThis.fetch;
const sessionId = "8c6c976d-0698-4a43-93e8-0fa776654881";
const favorite = {
	id: "0ca519d2-47f0-49af-b0f8-af727bc60ab3",
	cookingSessionId: sessionId,
	createdAt: "2026-09-17T10:00:00.000Z",
	displayName: "My saved dinner",
	completedAt: "2026-09-16T20:42:00.000Z",
	completionSummary: {
		title: "Dinner is ready",
		description: "Warm, savory, and ready to serve.",
	},
	nutrition: {
		status: "complete",
		estimated: true,
		caloriesKcal: 420,
		proteinG: 18,
	},
	recipe: {
		name: "Historical dish",
		description: "The persisted recipe snapshot",
		servings: 2,
		estimatedDuration: { minMinutes: 20, maxMinutes: 30 },
	},
} satisfies FavoriteResponse;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("Favorite page query uses bounded pagination and seeds session caches", async () => {
	const queryClient = new QueryClient();
	const requests: string[] = [];
	globalThis.fetch = (async (input) => {
		const url = new URL(String(input));
		requests.push(`${url.pathname}${url.search}`);
		return Response.json({ items: [favorite], nextOffset: null });
	}) as typeof fetch;

	expect(await requestFavoritesPage(queryClient, 10)).toEqual({
		items: [favorite],
		nextOffset: null,
	});
	expect(requests).toEqual(["/api/favorites?limit=10&offset=10"]);
	expect(
		queryClient.getQueryData(favoriteBySessionQueryKey(sessionId)),
	).toEqual(favorite);
});

test("session-scoped Favorite restoration uses the canonical filtered list endpoint", async () => {
	const queryClient = new QueryClient();
	const requests: string[] = [];
	globalThis.fetch = (async (input) => {
		const url = new URL(String(input));
		requests.push(`${url.pathname}${url.search}`);
		return Response.json({ items: [favorite], nextOffset: null });
	}) as typeof fetch;

	expect(await requestFavoriteBySession(queryClient, sessionId)).toEqual(
		favorite,
	);
	expect(requests).toEqual([
		`/api/favorites?limit=1&offset=0&cookingSessionId=${sessionId}`,
	]);
	expect(
		queryClient.getQueryData(favoriteBySessionQueryKey(sessionId)),
	).toEqual(favorite);
});

test("Favorite creation posts only the session identity and invalidates canonical projections", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(favoritesQueryKey(), {
		pages: [{ items: [], nextOffset: null }],
		pageParams: [0],
	});
	queryClient.setQueryData(cookingHistoryQueryKey(), {
		pages: [],
		pageParams: [],
	});
	const requests: Array<{ path: string; method: string; body: unknown }> = [];
	globalThis.fetch = (async (input, init) => {
		requests.push({
			path: new URL(String(input)).pathname,
			method: init?.method ?? "GET",
			body: init?.body ? JSON.parse(String(init.body)) : undefined,
		});
		return Response.json(favorite, { status: 201 });
	}) as typeof fetch;

	expect(await executeCreateFavorite(queryClient, sessionId)).toEqual(favorite);
	expect(requests).toEqual([
		{
			path: "/api/favorites",
			method: "POST",
			body: { cookingSessionId: sessionId },
		},
	]);
	expect(
		queryClient.getQueryData(favoriteBySessionQueryKey(sessionId)),
	).toEqual(favorite);
	expect(queryClient.getQueryState(favoritesQueryKey())?.isInvalidated).toBe(
		true,
	);
	expect(
		queryClient.getQueryState(cookingHistoryQueryKey())?.isInvalidated,
	).toBe(true);
});

test("concurrent save attempts share one Favorite create request", async () => {
	const queryClient = new QueryClient();
	let requests = 0;
	globalThis.fetch = (async () => {
		requests += 1;
		await Promise.resolve();
		return Response.json(favorite, { status: 201 });
	}) as typeof fetch;

	const first = executeCreateFavorite(queryClient, sessionId);
	const second = executeCreateFavorite(queryClient, sessionId);
	expect(second).toBe(first);
	expect(await Promise.all([first, second])).toEqual([favorite, favorite]);
	expect(requests).toBe(1);
});

test("duplicate response converges through the session-filtered persisted Favorite", async () => {
	const queryClient = new QueryClient();
	const requests: string[] = [];
	globalThis.fetch = (async (input, init) => {
		const url = new URL(String(input));
		requests.push(`${init?.method ?? "GET"} ${url.pathname}${url.search}`);
		if (init?.method === "POST") {
			return Response.json(
				{
					error: {
						code: "FAVORITE_ALREADY_EXISTS",
						message: "Favorite already exists",
					},
				},
				{ status: 409 },
			);
		}
		return Response.json({ items: [favorite], nextOffset: null });
	}) as typeof fetch;

	expect(await executeCreateFavorite(queryClient, sessionId)).toEqual(favorite);
	expect(requests).toEqual([
		"POST /api/favorites",
		`GET /api/favorites?limit=1&offset=0&cookingSessionId=${sessionId}`,
	]);
});

test("remove waits for one delete then synchronizes Favorites, History, Nutrition, and session caches", async () => {
	const queryClient = new QueryClient();
	const page: FavoritesResponse = { items: [favorite], nextOffset: null };
	queryClient.setQueryData(favoritesQueryKey(), {
		pages: [page],
		pageParams: [0],
	});
	queryClient.setQueryData(favoriteBySessionQueryKey(sessionId), favorite);
	queryClient.setQueryData(cookingHistoryQueryKey(), {
		pages: [],
		pageParams: [],
	});
	queryClient.setQueryData(cookingSessionQueryKey(sessionId), {
		persisted: "session",
	});
	let resolveDelete: ((response: Response) => void) | undefined;
	const deleteResponse = new Promise<Response>((resolve) => {
		resolveDelete = resolve;
	});
	const requests: string[] = [];
	globalThis.fetch = (async (input, init) => {
		requests.push(
			`${init?.method ?? "GET"} ${new URL(String(input)).pathname}`,
		);
		return deleteResponse;
	}) as typeof fetch;

	const first = executeDeleteFavorite(queryClient, favorite);
	const duplicate = executeDeleteFavorite(queryClient, favorite);
	expect(duplicate).toBe(first);
	resolveDelete?.(new Response(null, { status: 204 }));
	await Promise.all([first, duplicate]);

	expect(requests).toEqual([`DELETE /api/favorites/${favorite.id}`]);
	expect(
		queryClient.getQueryData<{ pages: FavoritesResponse[] }>(
			favoritesQueryKey(),
		)?.pages[0]?.items,
	).toEqual([]);
	expect(
		queryClient.getQueryData(favoriteBySessionQueryKey(sessionId)),
	).toBeNull();
	expect(
		queryClient.getQueryState(cookingHistoryQueryKey())?.isInvalidated,
	).toBe(true);
	expect(queryClient.getQueryData(cookingSessionQueryKey(sessionId))).toEqual({
		persisted: "session",
	});
});

test("already-removed Favorite converges to not saved while real failure keeps the card retryable", async () => {
	const missingClient = new QueryClient();
	missingClient.setQueryData(favoritesQueryKey(), {
		pages: [{ items: [favorite], nextOffset: null }],
		pageParams: [0],
	});
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "FAVORITE_NOT_FOUND", message: "Missing" } },
			{ status: 404 },
		)) as typeof fetch;
	await executeDeleteFavorite(missingClient, favorite);
	expect(
		missingClient.getQueryData(favoriteBySessionQueryKey(sessionId)),
	).toBeNull();

	const failedClient = new QueryClient();
	failedClient.setQueryData(favoritesQueryKey(), {
		pages: [{ items: [favorite], nextOffset: null }],
		pageParams: [0],
	});
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "DELETE_FAILED", message: "database detail" } },
			{ status: 500 },
		)) as typeof fetch;
	const error = await executeDeleteFavorite(failedClient, favorite).catch(
		(reason: unknown) => reason,
	);
	expect(favoriteDeleteErrorMessage(error)).toBe(
		"Flemme couldn't remove this favorite. Try again.",
	);
	expect(
		failedClient.getQueryData<{ pages: FavoritesResponse[] }>(
			favoritesQueryKey(),
		)?.pages[0]?.items,
	).toEqual([favorite]);
});

test("real save failure stays retryable without exposing backend detail", async () => {
	const queryClient = new QueryClient();
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "SAVE_FAILED", message: "database detail" } },
			{ status: 500 },
		)) as typeof fetch;

	const error = await executeCreateFavorite(queryClient, sessionId).catch(
		(reason: unknown) => reason,
	);
	expect(favoriteMutationErrorMessage(error)).toBe(
		"Flemme couldn't save this favorite. Your completed meal and Nutrition review are safe.",
	);
	expect(
		queryClient.getQueryData(favoriteBySessionQueryKey(sessionId)),
	).toBeUndefined();
});
