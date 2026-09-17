import { afterEach, expect, test } from "bun:test";
import type { CookingHistoryPage } from "@flemme/contracts/cooking-history";
import { QueryClient } from "@tanstack/react-query";
import {
	cookingHistoryQueryKey,
	invalidateCookingHistory,
	requestCookingHistoryPage,
} from "./cooking-history-query";

const originalFetch = globalThis.fetch;
const item = {
	sessionId: "8c6c976d-0698-4a43-93e8-0fa776654881",
	displayName: "History meal",
	completedAt: "2026-09-17T20:42:00.000Z",
	completionSummary: {
		title: "Finished",
		description: "A persisted completed meal.",
	},
	nutrition: {
		status: "complete" as const,
		estimated: true as const,
		caloriesKcal: 420,
		proteinG: 18,
	},
	isFavorite: true,
};

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("History query sends bounded offset pagination and validates the projection", async () => {
	const queryClient = new QueryClient();
	const requests: string[] = [];
	globalThis.fetch = (async (input) => {
		const url = new URL(String(input));
		requests.push(`${url.pathname}${url.search}`);
		return Response.json({
			items: [item],
			nextOffset: url.searchParams.get("offset") === "0" ? 10 : null,
		});
	}) as typeof fetch;

	const first = await requestCookingHistoryPage(queryClient, 0);
	const second = await requestCookingHistoryPage(queryClient, 10);

	expect(first).toEqual({ items: [item], nextOffset: 10 });
	expect(second).toEqual({ items: [item], nextOffset: null });
	expect(requests).toEqual([
		"/cooking-sessions/history?limit=10&offset=0",
		"/cooking-sessions/history?limit=10&offset=10",
	]);
});

test("canonical History invalidation marks every loaded page stale", async () => {
	const queryClient = new QueryClient();
	const page: CookingHistoryPage = { items: [item], nextOffset: null };
	queryClient.setQueryData(cookingHistoryQueryKey(), {
		pages: [page],
		pageParams: [0],
	});

	await invalidateCookingHistory(queryClient);

	expect(
		queryClient.getQueryState(cookingHistoryQueryKey())?.isInvalidated,
	).toBe(true);
});
