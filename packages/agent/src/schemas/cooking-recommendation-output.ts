import { z } from "zod";

const RequirementStatusSchema = z.enum(["available", "unconfirmed", "missing"]);

const IngredientRequirementSchema = z.object({
	name: z.string(),
	status: RequirementStatusSchema,
	requiredAmount: z.string().optional(),
	note: z.string().optional(),
});

const EquipmentRequirementSchema = z.object({
	name: z.string(),
	status: RequirementStatusSchema,
	note: z.string().optional(),
});

const CookingRecommendationSchema = z.object({
	name: z.string(),
	description: z.string(),
	reason: z.string(),
	estimatedDuration: z.object({
		minMinutes: z.number().int().positive(),
		maxMinutes: z.number().int().positive(),
	}),
	servings: z.number().int().positive(),
	feasibility: z.enum(["ready", "needs_confirmation", "blocked"]),
	ingredients: z.array(IngredientRequirementSchema),
	equipment: z.array(EquipmentRequirementSchema),
	preferenceMatches: z.array(z.string()),
	requiredConfirmations: z.array(z.string()),
	optionalIngredients: z.array(
		z.object({
			name: z.string(),
			note: z.string().optional(),
		}),
	),
	warnings: z.array(z.string()),
});

export const CookingRecommendationOutputSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("recommendations"),
		recommendations: z.array(CookingRecommendationSchema).min(1).max(3),
	}),
	z.object({
		type: z.literal("clarification"),
		question: z.string(),
		reason: z.string(),
	}),
	z.object({
		type: z.literal("no_viable_recommendation"),
		reason: z.string(),
		constraints: z.array(z.string()),
	}),
]);

export type CookingRecommendationOutput = z.infer<
	typeof CookingRecommendationOutputSchema
>;
