import { inventoryConditionEnum } from "@flemme/db";
import { IngredientKeySchema } from "@flemme/ingredients";
import { z } from "@hono/zod-openapi";

const QuantitySchema = z
	.number()
	.finite()
	.positive()
	.max(99_999_999_999.999)
	.refine(
		(value) => Number(value.toFixed(3)) === value,
		"At most three decimal places are supported",
	)
	.nullable();
export const InventoryItemValuesSchema = z.object({
	quantity: QuantitySchema,
	unit: z.string().trim().min(1).nullable(),
	isApproximate: z.boolean(),
	condition: z.enum(inventoryConditionEnum.enumValues),
});
function paired(value: { quantity: number | null; unit: string | null }) {
	return (value.quantity === null) === (value.unit === null);
}
export const CreateInventoryItemSchema = InventoryItemValuesSchema.extend({
	ingredientKey: IngredientKeySchema,
	isApproximate: z.boolean().default(false),
	condition: z.enum(inventoryConditionEnum.enumValues).default("unknown"),
})
	.strict()
	.refine(paired, "Quantity and unit must both be supplied or both null");
export const UpdateInventoryItemSchema =
	InventoryItemValuesSchema.strict().refine(
		paired,
		"Quantity and unit must both be supplied or both null",
	);
export const InventoryItemResponseSchema = InventoryItemValuesSchema.extend({
	id: z.string().uuid(),
	ingredientKey: IngredientKeySchema,
	name: z.string().min(1),
}).refine(paired, "Invalid persisted quantity/unit pair");
export const InventoryResponseSchema = z.object({
	items: z.array(InventoryItemResponseSchema),
});
export const InventoryItemParamsSchema = z.object({
	id: z
		.string()
		.uuid()
		.openapi({ param: { name: "id", in: "path" } }),
});
export type CreateInventoryItem = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>;
