import { z } from "zod";
import {
	MealCompletionSummarySchema,
	MealNutritionSummarySchema,
} from "./meal-projection";

export const COOKING_HISTORY_PAGE_SIZE = 10;
export const COOKING_HISTORY_MAX_PAGE_SIZE = 20;

export const CookingHistoryItemSchema = z
	.object({
		sessionId: z.string().uuid(),
		displayName: z.string().trim().min(1),
		completedAt: z.string().datetime({ offset: true }),
		completionSummary: MealCompletionSummarySchema.nullable(),
		nutrition: MealNutritionSummarySchema.nullable(),
		isFavorite: z.boolean(),
	})
	.strict();

export type CookingHistoryItem = z.infer<typeof CookingHistoryItemSchema>;

export const CookingHistoryPageSchema = z
	.object({
		items: z.array(CookingHistoryItemSchema),
		nextOffset: z.number().int().nonnegative().nullable(),
	})
	.strict();

export type CookingHistoryPage = z.infer<typeof CookingHistoryPageSchema>;
