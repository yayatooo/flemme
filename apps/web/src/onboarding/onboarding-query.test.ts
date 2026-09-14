import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { onboardingQueryOptions } from "./onboarding-query";

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
	});
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
