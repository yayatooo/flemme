import { afterEach, expect, test } from "bun:test";
import type {
	InventoryItemResponse,
	InventoryResponse,
} from "@flemme/contracts/inventory";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "@/api/api-client";
import {
	executeCreateInventoryItem,
	executeDeleteInventoryItem,
	executeUpdateInventoryItem,
	inventoryMutationErrorMessage,
} from "./inventory-mutations";
import { inventoryQueryKey, requestInventory } from "./inventory-query";

const originalFetch = globalThis.fetch;
const resolved: InventoryItemResponse = {
	id: "6a0de40f-5777-41d4-a217-3a1c06e8f799",
	ingredientKey: "egg",
	name: "Telur",
	quantity: 6,
	unit: "pcs",
	isApproximate: false,
	condition: "fresh",
};
const unresolved: InventoryItemResponse = {
	id: "65ca57f4-ab25-48a9-ad7a-a88ce2d5d22c",
	ingredientKey: null,
	name: "Daun Gedi",
	quantity: null,
	unit: null,
	isApproximate: false,
	condition: "unknown",
};

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("Inventory query restores the canonical resolved and unresolved items", async () => {
	const queryClient = new QueryClient();
	const requests: string[] = [];
	globalThis.fetch = (async (input, init) => {
		requests.push(
			`${init?.method ?? "GET"} ${new URL(String(input)).pathname}`,
		);
		return Response.json({ items: [resolved, unresolved] });
	}) as typeof fetch;

	expect(await requestInventory(queryClient)).toEqual({
		items: [resolved, unresolved],
	});
	expect(requests).toEqual(["GET /inventory"]);
});

test("duplicate create submissions share one request and update canonical cache", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(inventoryQueryKey, { items: [] });
	let resolveCreate: ((response: Response) => void) | undefined;
	const response = new Promise<Response>((resolve) => {
		resolveCreate = resolve;
	});
	const requests: Array<{ path: string; method: string; body: unknown }> = [];
	globalThis.fetch = (async (input, init) => {
		requests.push({
			path: new URL(String(input)).pathname,
			method: init?.method ?? "GET",
			body: init?.body ? JSON.parse(String(init.body)) : undefined,
		});
		return response;
	}) as typeof fetch;

	const input = {
		name: " Telur ",
		quantity: 6,
		unit: "pcs",
		isApproximate: false,
		condition: "unknown" as const,
	};
	const first = executeCreateInventoryItem(queryClient, input);
	const duplicate = executeCreateInventoryItem(queryClient, {
		...input,
		name: "telur",
	});
	expect(duplicate).toBe(first);
	resolveCreate?.(Response.json(resolved, { status: 201 }));
	expect(await Promise.all([first, duplicate])).toEqual([resolved, resolved]);
	expect(requests).toEqual([
		{
			path: "/inventory/items",
			method: "POST",
			body: {
				name: "Telur",
				quantity: 6,
				unit: "pcs",
				isApproximate: false,
				condition: "unknown",
			},
		},
	]);
	expect(
		queryClient.getQueryData<InventoryResponse>(inventoryQueryKey)?.items,
	).toEqual([resolved]);
});

test("edit replaces the canonical cached item and server duplicate copy stays controlled", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(inventoryQueryKey, {
		items: [unresolved],
	} satisfies InventoryResponse);
	const renamed = { ...unresolved, ingredientKey: "tomato", name: "Tomat" };
	globalThis.fetch = (async () => Response.json(renamed)) as typeof fetch;

	expect(
		await executeUpdateInventoryItem(queryClient, unresolved.id, {
			name: "Tomat",
			quantity: null,
			unit: null,
			isApproximate: false,
			condition: "unknown",
		}),
	).toEqual(renamed);
	expect(
		queryClient.getQueryData<InventoryResponse>(inventoryQueryKey)?.items,
	).toEqual([renamed]);

	const duplicate = new FlemmeApiError(
		409,
		"DUPLICATE_INVENTORY_ITEM",
		"backend detail",
	);
	expect(inventoryMutationErrorMessage(duplicate)).toBe(
		"This ingredient is already in your inventory.",
	);
});

test("delete shares one request, treats missing as removed, and keeps failures retryable", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(inventoryQueryKey, {
		items: [resolved, unresolved],
	} satisfies InventoryResponse);
	let resolveDelete: ((response: Response) => void) | undefined;
	const response = new Promise<Response>((resolve) => {
		resolveDelete = resolve;
	});
	let requests = 0;
	globalThis.fetch = (async () => {
		requests += 1;
		return response;
	}) as typeof fetch;
	const first = executeDeleteInventoryItem(queryClient, resolved.id);
	const duplicate = executeDeleteInventoryItem(queryClient, resolved.id);
	expect(duplicate).toBe(first);
	resolveDelete?.(new Response(null, { status: 204 }));
	await Promise.all([first, duplicate]);
	expect(requests).toBe(1);
	expect(
		queryClient.getQueryData<InventoryResponse>(inventoryQueryKey)?.items,
	).toEqual([unresolved]);

	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "INVENTORY_ITEM_NOT_FOUND", message: "Missing" } },
			{ status: 404 },
		)) as typeof fetch;
	await executeDeleteInventoryItem(queryClient, unresolved.id);
	expect(
		queryClient.getQueryData<InventoryResponse>(inventoryQueryKey)?.items,
	).toEqual([]);

	queryClient.setQueryData(inventoryQueryKey, { items: [resolved] });
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "DELETE_FAILED", message: "database detail" } },
			{ status: 500 },
		)) as typeof fetch;
	const error = await executeDeleteInventoryItem(
		queryClient,
		resolved.id,
	).catch((reason: unknown) => reason);
	expect(inventoryMutationErrorMessage(error)).toBe(
		"Flemme couldn't update your inventory. Try again.",
	);
	expect(
		queryClient.getQueryData<InventoryResponse>(inventoryQueryKey)?.items,
	).toEqual([resolved]);
});
