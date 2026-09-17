import { afterEach, expect, test } from "bun:test";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { QueryClient } from "@tanstack/react-query";
import { cookingSessionQueryKey } from "./cooking-session-query";
import {
	cookingSessionFixture,
	cookingSessionId,
} from "./cooking-session-test-fixture";
import {
	fetchResumableCookingSession,
	resumableCookingSessionQueryKey,
	synchronizeResumableCookingSession,
} from "./resumable-cooking-session-query";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("resumable query restores server state and seeds the canonical session cache", async () => {
	const queryClient = new QueryClient();
	const requests: Array<{ path: string; method: string }> = [];
	globalThis.fetch = (async (input, init) => {
		requests.push({
			path: new URL(String(input)).pathname,
			method: init?.method ?? "GET",
		});
		return Response.json({ session: cookingSessionFixture });
	}) as typeof fetch;

	const response = await fetchResumableCookingSession(queryClient);
	expect(response).toEqual({ session: cookingSessionFixture });
	expect(requests).toEqual([
		{ path: "/cooking-sessions/resumable", method: "GET" },
	]);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toEqual(cookingSessionFixture);
});

test("no resumable session remains an explicit server-backed null", async () => {
	const queryClient = new QueryClient();
	globalThis.fetch = (async () =>
		Response.json({ session: null })) as typeof fetch;

	expect(await fetchResumableCookingSession(queryClient)).toEqual({
		session: null,
	});
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toBeUndefined();
});

test("active and paused progress updates synchronize the Home resume cache", () => {
	const queryClient = new QueryClient();
	synchronizeResumableCookingSession(queryClient, cookingSessionFixture);
	expect(queryClient.getQueryData(resumableCookingSessionQueryKey())).toEqual({
		session: cookingSessionFixture,
	});

	const paused = {
		...cookingSessionFixture,
		session: {
			...cookingSessionFixture.session,
			status: "paused" as const,
			pauseReason: "interruption" as const,
		},
	};
	synchronizeResumableCookingSession(queryClient, paused);
	expect(
		queryClient.getQueryData<{ session: CookingSessionResponse | null }>(
			resumableCookingSessionQueryKey(),
		)?.session?.session.status,
	).toBe("paused");
});

test("completion and abandonment immediately remove the current Home card", () => {
	for (const status of ["completed", "abandoned"] as const) {
		const queryClient = new QueryClient();
		queryClient.setQueryData(resumableCookingSessionQueryKey(), {
			session: cookingSessionFixture,
		});
		const terminal = {
			...cookingSessionFixture,
			phase:
				status === "completed" ? ("completion" as const) : "active_cooking",
			session: { ...cookingSessionFixture.session, status },
			completedAt: status === "completed" ? "2026-09-17T10:00:00.000Z" : null,
		} satisfies CookingSessionResponse;

		synchronizeResumableCookingSession(queryClient, terminal);
		expect(queryClient.getQueryData(resumableCookingSessionQueryKey())).toEqual(
			{
				session: null,
			},
		);
	}
});
