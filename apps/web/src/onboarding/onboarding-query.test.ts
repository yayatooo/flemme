import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
	type OnboardingDecision,
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "./onboarding-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function onboardingDecisionFixture(
	completed: boolean,
	nextStep: OnboardingDecision["nextStep"],
): OnboardingDecision {
	return {
		completed,
		completedAt: completed ? "2026-09-15T00:00:00.000Z" : null,
		nextStep,
	};
}

test("loads canonical onboarding status from the backend", async () => {
	const expected = onboardingDecisionFixture(false, "household");
	globalThis.fetch = (async (input) => {
		expect(new URL(String(input)).pathname).toBe("/onboarding");
		return Response.json(expected);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await queryClient.ensureQueryData(onboardingQueryOptions(queryClient)),
	).toEqual(expected);
});

test("fresh users resume at Profile without self-redirecting", () => {
	const status = onboardingDecisionFixture(false, "profile");
	expect(resolveOnboardingRedirect(status, "/app", "app")).toBe(
		"/onboarding/profile",
	);
	expect(resolveOnboardingRedirect(status, "/onboarding", "onboarding")).toBe(
		"/onboarding/profile",
	);
	expect(
		resolveOnboardingRedirect(status, "/onboarding/profile", "profile"),
	).toBeNull();
});

test("inventory decisions advance to the explicit completion page", () => {
	const status = onboardingDecisionFixture(false, "complete");
	expect(
		resolveOnboardingRedirect(status, "/onboarding/inventory", "inventory"),
	).toBe("/onboarding/complete");
	expect(
		resolveOnboardingRedirect(status, "/onboarding/complete", "complete"),
	).toBeNull();
	expect(resolveOnboardingRedirect(status, "/app", "app")).toBe(
		"/onboarding/complete",
	);
});

test("completed users enter Home and cannot reopen completion", () => {
	const status = onboardingDecisionFixture(true, null);
	expect(resolveOnboardingRedirect(status, "/app", "app")).toBeNull();
	expect(resolveOnboardingRedirect(status, "/onboarding", "onboarding")).toBe(
		"/app",
	);
	expect(
		resolveOnboardingRedirect(status, "/onboarding/complete", "complete"),
	).toBe("/app");
});

test("does not downgrade unexpected failures into onboarding", async () => {
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected" } },
			{ status: 500 },
		)) as typeof fetch;
	const queryClient = new QueryClient();

	await expect(
		queryClient.ensureQueryData(onboardingQueryOptions(queryClient)),
	).rejects.toMatchObject({ status: 500, code: "INTERNAL_SERVER_ERROR" });
});
