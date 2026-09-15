import { afterEach, expect, test } from "bun:test";
import {
	kitchenEquipmentCatalog,
	kitchenEquipmentKeys,
} from "@flemme/contracts";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "../api/api-client";
import {
	emptyKitchen,
	kitchenErrorMessage,
	kitchenQueryKey,
	kitchenQueryOptions,
	saveKitchenAndResolveNext,
	toggleEquipment,
} from "./kitchen-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function json(payload: unknown, status = 200) {
	return Response.json(payload, { status });
}

test("catalog defines one labeled category for every canonical key", () => {
	expect(kitchenEquipmentCatalog.map(({ key }) => key)).toEqual([
		...kitchenEquipmentKeys,
	]);
	expect(
		kitchenEquipmentCatalog.every(
			({ category, label }) => category.length > 0 && label.length > 0,
		),
	).toBe(true);
});

test("missing Kitchen starts with no silently selected equipment", async () => {
	let method: string | undefined;
	globalThis.fetch = (async (_input, init) => {
		method = init?.method;
		return json(
			{ error: { code: "KITCHEN_NOT_FOUND", message: "Kitchen not found" } },
			404,
		);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	const kitchen = await queryClient.fetchQuery(
		kitchenQueryOptions(queryClient),
	);

	expect(kitchen).toBeNull();
	expect(kitchen ?? emptyKitchen).toEqual({ equipment: [] });
	expect(method).toBeUndefined();
});

test("existing Kitchen prepopulates all canonical selections", async () => {
	const persisted = {
		equipment: ["frying-pan", "rice-cooker", "stove"],
	} as const;
	globalThis.fetch = (async () => json(persisted)) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await queryClient.fetchQuery(kitchenQueryOptions(queryClient)),
	).toEqual(persisted);
});

test("equipment cards select and deselect without duplicates", () => {
	expect(toggleEquipment([], "stove")).toEqual(["stove"]);
	expect(toggleEquipment(["stove"], "rice-cooker")).toEqual([
		"stove",
		"rice-cooker",
	]);
	expect(toggleEquipment(["stove", "rice-cooker"], "stove")).toEqual([
		"rice-cooker",
	]);
});

test("successful save replaces Kitchen and advances to Initial Inventory", async () => {
	const payload = { equipment: ["stove", "pot"] } as const;
	const requests: Array<{ path: string; method: string }> = [];
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		requests.push({ path, method: init?.method ?? "GET" });
		if (path === "/kitchen" && init?.method === "PUT") return json(payload);
		if (path === "/onboarding")
			return json({
				completed: false,
				completedAt: null,
				nextStep: "inventory",
			});
		return json({ ok: true });
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await saveKitchenAndResolveNext(
			queryClient,
			{ equipment: [...payload.equipment] },
			"/onboarding/kitchen",
		),
	).toBe("/onboarding/inventory");
	expect(queryClient.getQueryData(kitchenQueryKey)).toEqual(payload);
	expect(requests[0]).toEqual({ path: "/kitchen", method: "PUT" });
});

test("post-onboarding save returns to app", async () => {
	const payload = { equipment: ["air-fryer"] } as const;
	globalThis.fetch = (async (input) => {
		const path = new URL(String(input)).pathname;
		if (path === "/onboarding")
			return json({
				completed: true,
				completedAt: "2026-09-15T00:00:00.000Z",
				nextStep: null,
			});
		return json(payload);
	}) as typeof fetch;

	expect(
		await saveKitchenAndResolveNext(
			new QueryClient(),
			{ equipment: [...payload.equipment] },
			"/onboarding/kitchen",
		),
	).toBe("/app");
});

test("failed save preserves cached Kitchen and skips navigation lookup", async () => {
	const queryClient = new QueryClient();
	const persisted = { equipment: ["stove"] } as const;
	queryClient.setQueryData(kitchenQueryKey, persisted);
	let requestCount = 0;
	globalThis.fetch = (async () => {
		requestCount += 1;
		return json(
			{ error: { code: "KITCHEN_SAVE_FAILED", message: "Could not save" } },
			500,
		);
	}) as typeof fetch;

	await expect(
		saveKitchenAndResolveNext(
			queryClient,
			{ equipment: ["oven"] },
			"/onboarding/kitchen",
		),
	).rejects.toMatchObject({ code: "KITCHEN_SAVE_FAILED" });
	expect(queryClient.getQueryData(kitchenQueryKey)).toEqual(persisted);
	expect(requestCount).toBe(1);
	expect(
		kitchenErrorMessage(
			new FlemmeApiError(500, "KITCHEN_SAVE_FAILED", "Could not save"),
		),
	).toBe("Couldn't save your kitchen equipment. Please try again.");
});
