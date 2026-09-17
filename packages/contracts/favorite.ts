import { CookingRecommendationSchema } from "@flemme/agent/cooking-recommendation-output";
import { z } from "zod";
import {
	MealCompletionSummarySchema,
	MealNutritionSummarySchema,
} from "./meal-projection";

export const FAVORITES_PAGE_SIZE = 10;
export const FAVORITES_MAX_PAGE_SIZE = 20;

export const CreateFavoriteSchema = z
	.object({ cookingSessionId: z.uuid() })
	.strict();

export type CreateFavorite = z.infer<typeof CreateFavoriteSchema>;

export const FavoriteResponseSchema = z
	.object({
		id: z.uuid(),
		cookingSessionId: z.uuid(),
		createdAt: z.iso.datetime(),
		displayName: z.string().trim().min(1),
		completedAt: z.iso.datetime(),
		completionSummary: MealCompletionSummarySchema.nullable(),
		nutrition: MealNutritionSummarySchema.nullable(),
		recipe: CookingRecommendationSchema.pick({
			name: true,
			description: true,
			servings: true,
			estimatedDuration: true,
		}),
	})
	.strict();

export type FavoriteResponse = z.infer<typeof FavoriteResponseSchema>;

export const FavoritesResponseSchema = z
	.object({
		items: z.array(FavoriteResponseSchema),
		nextOffset: z.number().int().nonnegative().nullable(),
	})
	.strict();

export type FavoritesResponse = z.infer<typeof FavoritesResponseSchema>;
