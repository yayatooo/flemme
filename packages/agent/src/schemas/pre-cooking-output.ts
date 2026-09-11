import { z } from "zod";

const IngredientSchema = z.object({
	name: z.string().trim().min(1),
	quantity: z.number().positive().optional(),
	unit: z.string().trim().min(1).optional(),
});

const EquipmentSchema = z.object({
	name: z.string().trim().min(1),
	required: z.boolean(),
});

const PlanStepSchema = z.object({
	id: z.string().trim().min(1),
	instruction: z.string().trim().min(1),
	estimatedMinutes: z.number().int().positive().optional(),
});

const CookingStageSchema = z.object({
	id: z.string().trim().min(1),
	title: z.string().trim().min(1),
	steps: z.array(PlanStepSchema).min(1),
});

export const PreCookingOutputSchema = z.object({
	preparationSummary: z.object({
		overview: z.string().trim().min(1),
		preparationTimeMinutes: z.number().int().positive().optional(),
		cookingTimeMinutes: z.number().int().positive().optional(),
	}),
	ingredients: z.array(IngredientSchema),
	equipment: z.array(EquipmentSchema),
	preparationSteps: z.array(PlanStepSchema),
	cookingStages: z.array(CookingStageSchema).min(1),
});

export type PreCookingOutput = z.infer<typeof PreCookingOutputSchema>;
