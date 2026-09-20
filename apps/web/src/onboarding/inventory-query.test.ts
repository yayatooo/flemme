import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "../api/api-client";
import {
	addInventoryLater,
	addPendingInventoryItem,
	emptyInventory,
	ingredientSuggestions,
	inventoryErrorMessage,
	inventoryQueryKey,
	inventoryQueryOptions,
	pendingInventoryItem,
	saveInitialInventory,
} from "./inventory-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function json(payload: unknown, status = 200) {
	return Response.json(payload, { status });
}

test("missing Inventory starts empty without persisting or assuming ingredients", async () => {
	let method: string | undefined;
	globalThis.fetch = (async (_input, init) => {
		method = init?.method;
		return json(
			{
				error: { code: "INVENTORY_NOT_FOUND", message: "Inventory not found" },
			},
			404,
		);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	const inventory = await queryClient.fetchQuery(
		inventoryQueryOptions(queryClient),
	);

	expect(inventory).toBeNull();
	expect(inventory ?? emptyInventory).toEqual({ items: [] });
	expect(method).toBeUndefined();
	expect(ingredientSuggestions).not.toContain("Chicken");
});

test("known names share canonical identity while unknown names normalize conservatively", () => {
	expect(pendingInventoryItem(" Telur ")).toEqual({
		identity: "egg",
		name: "Telur",
	});
	expect(pendingInventoryItem(" DAUN   GEDI ")).toEqual({
		identity: "daun gedi",
		name: "DAUN GEDI",
	});
	expect(pendingInventoryItem("   ")).toBeNull();
});

test("canonical and free-text duplicates are prevented", () => {
	const telur = addPendingInventoryItem([], "Telur");
	expect(telur.duplicate).toBe(false);
	expect(addPendingInventoryItem(telur.items, "egg").duplicate).toBe(true);

	const unknown = addPendingInventoryItem([], "Daun Gedi");
	expect(
		addPendingInventoryItem(unknown.items, " DAUN   GEDI ").duplicate,
	).toBe(true);
});

test("saving names advances to Completion and updates Inventory cache", async () => {
	const saved = {
		items: [
			{
				id: crypto.randomUUID(),
				ingredientKey: "egg",
				name: "Telur",
				quantity: null,
				unit: null,
				isApproximate: false,
				condition: "unknown",
			},
		],
	};
	const requests: Array<{ path: string; method: string; body?: string }> = [];
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		requests.push({
			path,
			method: init?.method ?? "GET",
			body: init?.body as string,
		});
		if (path === "/api/inventory/items" && init?.method === "PUT")
			return json(saved);
		if (path === "/api/onboarding")
			return json({
				completed: false,
				completedAt: null,
				nextStep: "complete",
			});
		return json({ ok: true });
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await saveInitialInventory(queryClient, [
			{ identity: "egg", name: "Telur" },
		]),
	).toBe("/onboarding/complete");
	expect(queryClient.getQueryData(inventoryQueryKey)).toEqual(saved);
	expect(requests[0]).toEqual({
		path: "/api/inventory/items",
		method: "PUT",
		body: JSON.stringify({ items: [{ name: "Telur" }] }),
	});
});

test("Add later initializes an empty Inventory and advances to Completion", async () => {
	const empty = { items: [] };
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		if (path === "/api/inventory" && init?.method === "PUT") return json(empty);
		if (path === "/api/onboarding")
			return json({
				completed: false,
				completedAt: null,
				nextStep: "complete",
			});
		return json({ ok: true });
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(await addInventoryLater(queryClient)).toBe("/onboarding/complete");
	expect(queryClient.getQueryData(inventoryQueryKey)).toEqual(empty);
});

test("failed inventory save preserves cached state and exposes optional fallback", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(inventoryQueryKey, null);
	let requestCount = 0;
	globalThis.fetch = (async () => {
		requestCount += 1;
		return json(
			{ error: { code: "INVENTORY_SAVE_FAILED", message: "Could not save" } },
			500,
		);
	}) as typeof fetch;

	await expect(
		saveInitialInventory(queryClient, [
			{ identity: "daun gedi", name: "Daun Gedi" },
		]),
	).rejects.toMatchObject({ code: "INVENTORY_SAVE_FAILED" });
	expect(queryClient.getQueryData(inventoryQueryKey)).toBeNull();
	expect(requestCount).toBe(1);
	expect(
		inventoryErrorMessage(
			new FlemmeApiError(500, "INVENTORY_SAVE_FAILED", "Could not save"),
		),
	).toBe("Couldn't save your ingredients. Your selections are still here.");
});
