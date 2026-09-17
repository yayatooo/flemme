import {
	type CreateInventoryItem,
	CreateInventoryItemSchema,
	InventoryItemNameSchema,
	type InventoryItemResponse,
	InventoryItemResponseSchema,
	type InventoryResponse,
	InventoryResponseSchema,
	type UpdateInventoryItem,
	UpdateInventoryItemSchema,
} from "@flemme/contracts/inventory";
import { z } from "@hono/zod-openapi";

export type {
	CreateInventoryItem,
	InventoryItemResponse,
	InventoryResponse,
	UpdateInventoryItem,
};

export {
	CreateInventoryItemSchema,
	InventoryItemResponseSchema,
	InventoryResponseSchema,
	UpdateInventoryItemSchema,
};

export const ReplaceInventoryItemsSchema = z
	.object({
		items: z.array(
			z
				.object({
					name: InventoryItemNameSchema,
				})
				.strict(),
		),
	})
	.strict();

export const InventoryItemParamsSchema = z
	.object({
		id: z
			.string()
			.uuid()
			.openapi({ param: { name: "id", in: "path" } }),
	})
	.strict();

export type ReplaceInventoryItems = z.infer<typeof ReplaceInventoryItemsSchema>;
