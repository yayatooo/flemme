import { afterEach, expect, test } from "bun:test";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { QueryClient } from "@tanstack/react-query";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";
import {
	cookingSessionFixture,
	cookingSessionId,
} from "@/features/cooking-session/cooking-session-test-fixture";
import { cookingHistoryQueryKey } from "@/features/history/cooking-history-query";
import {
	requestCompletion,
	restoreOrRequestCompletion,
} from "./completion-query";

const completionOutput = {
	reply: "You finished dinner and kept the cooking plan on track.",
	summary: {
		title: "Dinner is ready",
		description: "The final step and your recorded changes are saved.",
	},
	notes: ["Use the same lower heat next time."],
};

const completedSession: CookingSessionResponse = {
	...cookingSessionFixture,
	customName: "Weeknight chicken",
	phase: "completion",
	session: {
		...cookingSessionFixture.session,
		status: "completed",
		changes: [
			{
				kind: "step",
				description: "Lowered the heat before finishing.",
				relatedStepId: cookingSessionFixture.session.currentStepId,
			},
		],
	},
	completionSnapshot: completionOutput,
	completedAt: "2026-09-15T10:30:00.000Z",
};

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("generation sends one Completion request and seeds the canonical session cache", async () => {
	const requests: Array<{ path: string; method: string; body: unknown }> = [];
	globalThis.fetch = (async (input, init) => {
		requests.push({
			path: new URL(String(input)).pathname,
			method: init?.method ?? "GET",
			body: JSON.parse(String(init?.body)),
		});
		return Response.json(completedSession);
	}) as typeof fetch;
	const queryClient = new QueryClient();
	queryClient.setQueryData(cookingHistoryQueryKey(), {
		pages: [],
		pageParams: [],
	});

	const output = await requestCompletion(queryClient, cookingSessionId);

	expect(output).toEqual(completionOutput);
	expect(requests).toEqual([
		{
			path: `/api/cooking-sessions/${cookingSessionId}/completion`,
			method: "POST",
			body: {},
		},
	]);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toEqual(completedSession);
	expect(
		queryClient.getQueryState(cookingHistoryQueryKey())?.isInvalidated,
	).toBe(true);
	expect(requests.some(({ path }) => path.includes("nutrition"))).toBeFalse();
	expect(requests.some(({ path }) => path.includes("inventory"))).toBeFalse();
	expect(requests.some(({ path }) => path.includes("favorite"))).toBeFalse();
});

test("refresh restores persisted Completion output without another POST", async () => {
	let requests = 0;
	globalThis.fetch = (async () => {
		requests += 1;
		return Response.json(completedSession);
	}) as typeof fetch;

	const output = await restoreOrRequestCompletion(
		new QueryClient(),
		cookingSessionId,
		completedSession,
	);

	expect(output).toEqual(completionOutput);
	expect(requests).toBe(0);
});
