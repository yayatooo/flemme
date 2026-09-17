import { z } from "zod";

export const InventoryConditionSchema = z.enum([
	"fresh",
	"use_soon",
	"unknown",
]);

export const InventoryItemNameSchema = z
	.string()
	.trim()
	.min(1)
	.max(120)
	.transform((name) => name.replace(/\s+/gu, " "));

export const InventoryQuantitySchema = z
	.number()
	.finite()
	.positive()
	.max(99_999_999_999.999)
	.refine(
		(value) => Number(value.toFixed(3)) === value,
		"At most three decimal places are supported",
	)
	.nullable();

function quantityAndUnitArePaired(value: {
	quantity: number | null;
	unit: string | null;
}) {
	return (value.quantity === null) === (value.unit === null);
}

export const InventoryItemValuesSchema = z
	.object({
		name: InventoryItemNameSchema,
		quantity: InventoryQuantitySchema,
		unit: z.string().trim().min(1).max(40).nullable(),
		isApproximate: z.boolean(),
		condition: InventoryConditionSchema,
	})
	.strict()
	.refine(quantityAndUnitArePaired, {
		message: "Quantity and unit must both be supplied or both null",
	});

export const CreateInventoryItemSchema = z
	.object({
		name: InventoryItemNameSchema,
		quantity: InventoryQuantitySchema.default(null),
		unit: z.string().trim().min(1).max(40).nullable().default(null),
		isApproximate: z.boolean().default(false),
		condition: InventoryConditionSchema.default("unknown"),
	})
	.strict()
	.refine(quantityAndUnitArePaired, {
		message: "Quantity and unit must both be supplied or both null",
	});

export const UpdateInventoryItemSchema = InventoryItemValuesSchema;

export const InventoryItemResponseSchema = InventoryItemValuesSchema.safeExtend(
	{
		id: z.uuid(),
		ingredientKey: z.string().trim().min(1).nullable(),
	},
);

export const InventoryResponseSchema = z
	.object({ items: z.array(InventoryItemResponseSchema) })
	.strict();

export type CreateInventoryItem = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>;
export type InventoryItemResponse = z.infer<typeof InventoryItemResponseSchema>;
export type InventoryResponse = z.infer<typeof InventoryResponseSchema>;
