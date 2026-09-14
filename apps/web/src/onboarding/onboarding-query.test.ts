import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
	deriveOnboardingDecision,
	type OnboardingDecision,
	type OnboardingResourceName,
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "./onboarding-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

const missingCodeByPath: Record<string, string> = {
	"/profile": "PROFILE_NOT_FOUND",
	"/household": "HOUSEHOLD_NOT_FOUND",
	"/kitchen": "KITCHEN_NOT_FOUND",
	"/inventory": "INVENTORY_NOT_FOUND",
};

function onboardingDecisionFixture(
	required: boolean,
	nextStep: OnboardingDecision["nextStep"],
	missing: OnboardingDecision["missing"],
): OnboardingDecision {
	return { required, nextStep, missing };
}

test("maps expected missing resources into onboarding state", async () => {
	globalThis.fetch = (async (input) => {
		const path = new URL(String(input)).pathname;
		return Response.json(
			{ error: { code: missingCodeByPath[path], message: "Missing" } },
			{ status: 404 },
		);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await queryClient.ensureQueryData(onboardingQueryOptions(queryClient)),
	).toEqual({
		required: true,
		missing: ["Profile", "Household", "Kitchen", "Inventory"],
		nextStep: "profile",
	});
});

test("derive decision picks the first missing resource as next step", () => {
	const statuses: Array<OnboardingResourceName | null> = [
		null,
		"Household",
		"Kitchen",
		null,
	];
	expect(deriveOnboardingDecision(statuses)).toEqual({
		missing: ["Household", "Kitchen"],
		nextStep: "household",
		required: true,
	});
});

test("treats an existing empty inventory as initialized", async () => {
	globalThis.fetch = (async (input) => {
		const path = new URL(String(input)).pathname;
		if (path === "/inventory") return Response.json({ items: [] });
		return Response.json({ ok: true });
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await queryClient.ensureQueryData(onboardingQueryOptions(queryClient)),
	).toEqual({
		required: false,
		missing: [],
		nextStep: null,
	});
});

test("fresh user all missing resolves to /onboarding/profile", () => {
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "profile", [
				"Profile",
				"Household",
				"Kitchen",
				"Inventory",
			]),
			"/app",
			"app",
		),
	).toBe("/onboarding/profile");
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "profile", [
				"Profile",
				"Household",
				"Kitchen",
				"Inventory",
			]),
			"/onboarding",
			"onboarding",
		),
	).toBe("/onboarding/profile");
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "profile", [
				"Profile",
				"Household",
				"Kitchen",
				"Inventory",
			]),
			"/onboarding/profile",
			"profile",
		),
	).toBeNull();
});

test("route resolvers do not self-redirect", () => {
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "household", [
				"Household",
				"Kitchen",
				"Inventory",
			]),
			"/onboarding/household",
			"household",
		),
	).toBeNull();
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "kitchen", [
				"Household",
				"Kitchen",
				"Inventory",
			]),
			"/onboarding/kitchen",
			"kitchen",
		),
	).toBeNull();
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "inventory", ["Kitchen", "Inventory"]),
			"/onboarding/inventory",
			"inventory",
		),
	).toBeNull();
});

test("route resolvers redirect mismatched steps once", () => {
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(true, "kitchen", [
				"Household",
				"Kitchen",
				"Inventory",
			]),
			"/onboarding/profile",
			"profile",
		),
	).toBe("/onboarding/kitchen");
	expect(
		resolveOnboardingRedirect(
			onboardingDecisionFixture(false, null, []),
			"/onboarding/inventory",
			"inventory",
		),
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
