import {
	type InventoryResponse,
	InventoryResponseSchema,
} from "@flemme/contracts/inventory";
import {
	type QueryClient,
	queryOptions,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { FlemmeApiError, requestApi } from "@/api/api-client";
import { handleUnauthorized } from "@/auth/auth-actions";

export const inventoryQueryKey = ["inventory"] as const;
export const emptyInventory: InventoryResponse = { items: [] };

export function isMissingInventoryError(
	error: unknown,
): error is FlemmeApiError {
	return (
		error instanceof FlemmeApiError &&
		error.status === 404 &&
		error.code === "INVENTORY_NOT_FOUND"
	);
}

export async function requestInventory(
	queryClient: QueryClient,
): Promise<InventoryResponse | null> {
	try {
		const payload: unknown = await requestApi<unknown>(
			"/inventory",
			undefined,
			() => handleUnauthorized(queryClient),
		);
		return InventoryResponseSchema.parse(payload);
	} catch (error) {
		if (isMissingInventoryError(error)) return null;
		throw error;
	}
}

export function inventoryQueryOptions(queryClient: QueryClient) {
	return queryOptions({
		queryKey: inventoryQueryKey,
		queryFn: () => requestInventory(queryClient),
		staleTime: 0,
		refetchOnMount: "always",
		retry: false,
	});
}

export function useInventory() {
	const queryClient = useQueryClient();
	return useQuery(inventoryQueryOptions(queryClient));
}
