import { z } from "@hono/zod-openapi";

const PersistedEquipmentNameSchema = z
	.string()
	.refine(
		(name) => name.length > 0 && name === name.trim(),
		"Equipment names must be non-blank and normalized",
	);

const EquipmentNameInputSchema = z.string().trim().min(1);

function rejectDuplicateEquipment(
	equipment: string[],
	context: z.RefinementCtx,
) {
	const seenNames = new Set<string>();

	for (const [index, name] of equipment.entries()) {
		const identity = name.toLowerCase();

		if (seenNames.has(identity)) {
			context.addIssue({
				code: "custom",
				message: "Equipment names must be unique ignoring case",
				path: ["equipment", index],
			});
		}

		seenNames.add(identity);
	}
}

export const KitchenResponseSchema = z
	.object({
		equipment: z.array(PersistedEquipmentNameSchema),
	})
	.superRefine(({ equipment }, context) => {
		rejectDuplicateEquipment(equipment, context);
	});

export type KitchenResponse = z.infer<typeof KitchenResponseSchema>;

export const PutKitchenRequestSchema = z
	.object({
		equipment: z.array(EquipmentNameInputSchema),
	})
	.strict()
	.superRefine(({ equipment }, context) => {
		rejectDuplicateEquipment(equipment, context);
	});

export type PutKitchenRequest = z.infer<typeof PutKitchenRequestSchema>;
