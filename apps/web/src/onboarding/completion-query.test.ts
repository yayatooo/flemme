import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "../api/api-client";
import { completeOnboarding, completionErrorMessage } from "./completion-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function json(payload: unknown, status = 200) {
	return Response.json(payload, { status });
}

test("completion persists once and returns Home", async () => {
	let requests = 0;
	const completed = {
		completed: true,
		completedAt: "2026-09-15T00:00:00.000Z",
		nextStep: null,
	};
	globalThis.fetch = (async (input, init) => {
		expect(new URL(String(input)).pathname).toBe("/onboarding/complete");
		expect(init?.method).toBe("POST");
		requests += 1;
		return json(completed);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(await completeOnboarding(queryClient)).toBe("/app");
	expect(requests).toBe(1);
	expect(queryClient.getQueryData(["onboarding", "decision"])).toEqual(
		completed,
	);
});

test("incomplete completion refreshes status and resumes the actual step", async () => {
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		if (path === "/onboarding/complete" && init?.method === "POST") {
			return json(
				{
					error: {
						code: "ONBOARDING_INCOMPLETE",
						message: "Required onboarding steps are incomplete",
					},
				},
				409,
			);
		}
		return json({ completed: false, completedAt: null, nextStep: "kitchen" });
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(await completeOnboarding(queryClient)).toBe("/onboarding/kitchen");
});

test("completion failures use saved-state recovery copy", () => {
	expect(
		completionErrorMessage(
			new FlemmeApiError(500, "INTERNAL_SERVER_ERROR", "Unexpected"),
		),
	).toBe(
		"Couldn't finish setup. Your information has already been saved. Please try again.",
	);
});
