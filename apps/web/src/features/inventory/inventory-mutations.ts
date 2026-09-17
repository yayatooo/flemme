import {
	type CreateInventoryItem,
	CreateInventoryItemSchema,
	type InventoryItemResponse,
	InventoryItemResponseSchema,
	type InventoryResponse,
	type UpdateInventoryItem,
	UpdateInventoryItemSchema,
} from "@flemme/contracts/inventory";
import {
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";
import { inventoryQueryKey } from "./inventory-query";

const pendingCreates = new WeakMap<
	QueryClient,
	Map<string, Promise<InventoryItemResponse>>
>();
const pendingUpdates = new WeakMap<
	QueryClient,
	Map<string, Promise<InventoryItemResponse>>
>();
const pendingDeletes = new WeakMap<QueryClient, Map<string, Promise<void>>>();

function normalizedName(name: string) {
	return name.trim().replace(/\s+/gu, " ").toLowerCase();
}

function synchronizeItem(
	queryClient: QueryClient,
	item: InventoryItemResponse,
) {
	queryClient.setQueryData<InventoryResponse | null>(
		inventoryQueryKey,
		(current) => {
			const items = current?.items ?? [];
			const index = items.findIndex((candidate) => candidate.id === item.id);
			return {
				items:
					index === -1
						? [...items, item]
						: items.map((candidate) =>
								candidate.id === item.id ? item : candidate,
							),
			};
		},
	);
	void queryClient.invalidateQueries({ queryKey: inventoryQueryKey });
}

function synchronizeDeletedItem(queryClient: QueryClient, itemId: string) {
	queryClient.setQueryData<InventoryResponse | null>(
		inventoryQueryKey,
		(current) =>
			current
				? { items: current.items.filter((item) => item.id !== itemId) }
				: current,
	);
	void queryClient.invalidateQueries({ queryKey: inventoryQueryKey });
}

async function createInventoryItemRequest(
	queryClient: QueryClient,
	input: CreateInventoryItem,
) {
	const body = CreateInventoryItemSchema.parse(input);
	const payload: unknown = await requestApi<unknown>(
		"/inventory/items",
		{ method: "POST", body: JSON.stringify(body) },
		() => handleUnauthorized(queryClient),
	);
	return InventoryItemResponseSchema.parse(payload);
}

async function updateInventoryItemRequest(
	queryClient: QueryClient,
	itemId: string,
	input: UpdateInventoryItem,
) {
	const body = UpdateInventoryItemSchema.parse(input);
	const payload: unknown = await requestApi<unknown>(
		`/inventory/items/${encodeURIComponent(itemId)}`,
		{ method: "PUT", body: JSON.stringify(body) },
		() => handleUnauthorized(queryClient),
	);
	return InventoryItemResponseSchema.parse(payload);
}

async function deleteInventoryItemRequest(
	queryClient: QueryClient,
	itemId: string,
) {
	try {
		await requestApi<undefined>(
			`/inventory/items/${encodeURIComponent(itemId)}`,
			{ method: "DELETE" },
			() => handleUnauthorized(queryClient),
		);
	} catch (error) {
		if (error instanceof FlemmeApiError && error.status === 404) return;
		throw error;
	}
}

export function executeCreateInventoryItem(
	queryClient: QueryClient,
	input: CreateInventoryItem,
): Promise<InventoryItemResponse> {
	let requests = pendingCreates.get(queryClient);
	if (!requests) {
		requests = new Map();
		pendingCreates.set(queryClient, requests);
	}
	const key = normalizedName(input.name);
	const pending = requests.get(key);
	if (pending) return pending;
	const request = createInventoryItemRequest(queryClient, input)
		.then((item) => {
			synchronizeItem(queryClient, item);
			return item;
		})
		.finally(() => requests?.delete(key));
	requests.set(key, request);
	return request;
}

export function executeUpdateInventoryItem(
	queryClient: QueryClient,
	itemId: string,
	input: UpdateInventoryItem,
): Promise<InventoryItemResponse> {
	let requests = pendingUpdates.get(queryClient);
	if (!requests) {
		requests = new Map();
		pendingUpdates.set(queryClient, requests);
	}
	const pending = requests.get(itemId);
	if (pending) return pending;
	const request = updateInventoryItemRequest(queryClient, itemId, input)
		.then((item) => {
			synchronizeItem(queryClient, item);
			return item;
		})
		.finally(() => requests?.delete(itemId));
	requests.set(itemId, request);
	return request;
}

export function executeDeleteInventoryItem(
	queryClient: QueryClient,
	itemId: string,
): Promise<void> {
	let requests = pendingDeletes.get(queryClient);
	if (!requests) {
		requests = new Map();
		pendingDeletes.set(queryClient, requests);
	}
	const pending = requests.get(itemId);
	if (pending) return pending;
	const request = deleteInventoryItemRequest(queryClient, itemId)
		.then(() => synchronizeDeletedItem(queryClient, itemId))
		.finally(() => requests?.delete(itemId));
	requests.set(itemId, request);
	return request;
}

export function inventoryMutationErrorMessage(error: unknown) {
	if (error instanceof FlemmeApiError) {
		if (error.status === 0) {
			return "Unable to reach Flemme. Your inventory has not changed.";
		}
		if (error.status === 409) {
			return "This ingredient is already in your inventory.";
		}
		if (error.status === 400) {
			return "Check the ingredient name, quantity, and unit.";
		}
	}
	return "Flemme couldn't update your inventory. Try again.";
}

export function useCreateInventoryItemMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...inventoryQueryKey, "create"],
		mutationFn: (input: CreateInventoryItem) =>
			executeCreateInventoryItem(queryClient, input),
	});
}

export function useUpdateInventoryItemMutation(itemId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...inventoryQueryKey, itemId, "update"],
		mutationFn: (input: UpdateInventoryItem) =>
			executeUpdateInventoryItem(queryClient, itemId, input),
	});
}

export function useDeleteInventoryItemMutation(itemId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...inventoryQueryKey, itemId, "delete"],
		mutationFn: () => executeDeleteInventoryItem(queryClient, itemId),
	});
}
