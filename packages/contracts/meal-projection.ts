import { z } from "zod";

export const MealCompletionSummarySchema = z
	.object({
		title: z.string().trim().min(1),
		description: z.string().trim().min(1),
	})
	.strict();

export type MealCompletionSummary = z.infer<typeof MealCompletionSummarySchema>;

export const MealNutritionSummarySchema = z.discriminatedUnion("status", [
	z
		.object({
			status: z.enum(["complete", "partial"]),
			estimated: z.literal(true),
			caloriesKcal: z.number().finite().nonnegative(),
			proteinG: z.number().finite().nonnegative(),
		})
		.strict(),
	z.object({ status: z.literal("unavailable") }).strict(),
]);

export type MealNutritionSummary = z.infer<typeof MealNutritionSummarySchema>;
