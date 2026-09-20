import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "../api/api-client";
import {
	defaultHousehold,
	householdErrorMessage,
	householdMemberCount,
	householdQueryKey,
	householdQueryOptions,
	MAX_HOUSEHOLD_COUNT,
	saveHouseholdAndResolveNext,
	updateHouseholdCount,
} from "./household-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function json(payload: unknown, status = 200) {
	return Response.json(payload, { status });
}

test("missing Household starts with one adult without persisting", async () => {
	let method: string | undefined;
	globalThis.fetch = (async (_input, init) => {
		method = init?.method;
		return json(
			{
				error: {
					code: "HOUSEHOLD_NOT_FOUND",
					message: "Household not found",
				},
			},
			404,
		);
	}) as typeof fetch;
	const household = await new QueryClient().fetchQuery(
		householdQueryOptions(new QueryClient()),
	);

	expect(household).toBeNull();
	expect(household ?? defaultHousehold).toEqual({
		adults: 1,
		children: 0,
		toddlers: 0,
	});
	expect(method).toBeUndefined();
});

test("existing Household prepopulates every count", async () => {
	const persisted = { adults: 2, children: 1, toddlers: 1 };
	globalThis.fetch = (async () => json(persisted)) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await queryClient.fetchQuery(householdQueryOptions(queryClient)),
	).toEqual(persisted);
});

test("steppers clamp each count between zero and the defensive maximum", () => {
	expect(updateHouseholdCount(defaultHousehold, "adults", -1)).toEqual({
		adults: 0,
		children: 0,
		toddlers: 0,
	});
	expect(
		updateHouseholdCount(
			{ adults: 0, children: MAX_HOUSEHOLD_COUNT, toddlers: 0 },
			"children",
			1,
		),
	).toEqual({ adults: 0, children: MAX_HOUSEHOLD_COUNT, toddlers: 0 });
	expect(
		updateHouseholdCount(
			{ adults: 0, children: 0, toddlers: 0 },
			"toddlers",
			-1,
		),
	).toEqual({ adults: 0, children: 0, toddlers: 0 });
});

test("at least one household member is required", () => {
	expect(householdMemberCount({ adults: 0, children: 0, toddlers: 0 })).toBe(0);
	expect(householdMemberCount({ adults: 2, children: 2, toddlers: 1 })).toBe(5);
});

test("successful save replaces Household and advances to Kitchen", async () => {
	const payload = { adults: 2, children: 1, toddlers: 0 };
	const requests: Array<{ path: string; method: string }> = [];
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		requests.push({ path, method: init?.method ?? "GET" });
		if (path === "/api/household" && init?.method === "PUT") return json(payload);
		if (path === "/api/onboarding")
			return json({
				completed: false,
				completedAt: null,
				nextStep: "kitchen",
			});
		return json({ ok: true });
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await saveHouseholdAndResolveNext(
			queryClient,
			payload,
			"/onboarding/household",
		),
	).toBe("/onboarding/kitchen");
	expect(queryClient.getQueryData(householdQueryKey)).toEqual(payload);
	expect(requests[0]).toEqual({ path: "/api/household", method: "PUT" });
});

test("save advances to the actual remaining step or app", async () => {
	const payload = { adults: 1, children: 0, toddlers: 0 };
	globalThis.fetch = (async (input) => {
		const path = new URL(String(input)).pathname;
		if (path === "/api/onboarding")
			return json({
				completed: false,
				completedAt: null,
				nextStep: "inventory",
			});
		return json(payload);
	}) as typeof fetch;

	expect(
		await saveHouseholdAndResolveNext(
			new QueryClient(),
			payload,
			"/onboarding/household",
		),
	).toBe("/onboarding/inventory");

	globalThis.fetch = (async (input) => {
		const path = new URL(String(input)).pathname;
		if (path === "/api/onboarding")
			return json({
				completed: true,
				completedAt: "2026-09-15T00:00:00.000Z",
				nextStep: null,
			});
		return json(payload);
	}) as typeof fetch;
	expect(
		await saveHouseholdAndResolveNext(
			new QueryClient(),
			payload,
			"/onboarding/household",
		),
	).toBe("/app");
});

test("failed save preserves cached Household and skips navigation lookup", async () => {
	const queryClient = new QueryClient();
	const persisted = { adults: 2, children: 0, toddlers: 0 };
	queryClient.setQueryData(householdQueryKey, persisted);
	let requestCount = 0;
	globalThis.fetch = (async () => {
		requestCount += 1;
		return json(
			{ error: { code: "HOUSEHOLD_SAVE_FAILED", message: "Could not save" } },
			500,
		);
	}) as typeof fetch;

	await expect(
		saveHouseholdAndResolveNext(
			queryClient,
			{ adults: 3, children: 1, toddlers: 0 },
			"/onboarding/household",
		),
	).rejects.toMatchObject({ code: "HOUSEHOLD_SAVE_FAILED" });
	expect(queryClient.getQueryData(householdQueryKey)).toEqual(persisted);
	expect(requestCount).toBe(1);
	expect(
		householdErrorMessage(
			new FlemmeApiError(500, "HOUSEHOLD_SAVE_FAILED", "Could not save"),
		),
	).toBe("Couldn't save your household. Please try again.");
});
