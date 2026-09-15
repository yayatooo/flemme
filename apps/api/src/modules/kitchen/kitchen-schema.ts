import { KitchenEquipmentKeySchema } from "@flemme/contracts";
import { z } from "@hono/zod-openapi";

const EquipmentSelectionSchema = z
	.array(KitchenEquipmentKeySchema)
	.min(1)
	.refine((equipment) => new Set(equipment).size === equipment.length, {
		message: "Equipment keys must be unique",
	});

export const KitchenResponseSchema = z.object({
	equipment: EquipmentSelectionSchema,
});

export type KitchenResponse = z.infer<typeof KitchenResponseSchema>;

export const PutKitchenRequestSchema = KitchenResponseSchema.strict();

export type PutKitchenRequest = z.infer<typeof PutKitchenRequestSchema>;
