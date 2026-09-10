import { z } from "zod";

export const CookingRecommendationInputSchema = z.object({
	inventory: z.array(
		z.object({
			name: z.string(),
			quantity: z.string().optional(),
			condition: z.enum(["fresh", "use_soon", "unknown"]).optional(),
		}),
	),
	kitchen: z.object({
		equipment: z.array(z.string()),
	}),
	household: z.object({
		adults: z.number().int().nonnegative(),
		children: z.number().int().nonnegative(),
		toddlers: z.number().int().nonnegative(),
	}),
	foodPreferences: z.array(z.string()),
	cookingPreferences: z.array(z.string()),
	session: z.object({
		request: z.string().optional(),
		servings: z.number().int().positive().optional(),
		availableMinutes: z.number().int().positive().optional(),
	}),
});

export type CookingRecommendationInput = z.infer<
	typeof CookingRecommendationInputSchema
>;
