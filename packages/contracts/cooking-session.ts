import {
	ActiveCookingPlanSessionSchema,
	ActiveCookingSessionSchema,
} from "@flemme/agent/active-cooking-input";
import { CompletionOutputSchema } from "@flemme/agent/completion-output";
import {
	CookingRecommendationOutputSchema,
	CookingRecommendationSchema,
} from "@flemme/agent/cooking-recommendation-output";
import { RecipeNutritionResultSchema } from "@flemme/nutrition/recipe-nutrition";
import { z } from "zod";

export const CookingSessionIdSchema = z.string().uuid();

export const COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH = 100;

export const CookingSessionCustomNameSchema = z
	.string()
	.trim()
	.min(1)
	.max(COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH);

export const UpdateCookingSessionRequestSchema = z
	.object({
		customName: CookingSessionCustomNameSchema.nullable(),
	})
	.strict();

export type UpdateCookingSessionRequest = z.infer<
	typeof UpdateCookingSessionRequestSchema
>;

export const CreateCookingSessionRequestSchema =
	ActiveCookingPlanSessionSchema.safeExtend({
		recommendationSnapshot: CookingRecommendationOutputSchema,
		selectedRecipeSnapshot: CookingRecommendationSchema,
	})
		.strict()
		.superRefine(({ session }, context) => {
			if (session.status !== "active") {
				context.addIssue({
					code: "custom",
					message: "A new cooking session must start active",
					path: ["session", "status"],
				});
			}
		});

export type CreateCookingSessionRequest = z.infer<
	typeof CreateCookingSessionRequestSchema
>;

export const CookingSessionResponseSchema = z.object({
	id: CookingSessionIdSchema,
	customName: CookingSessionCustomNameSchema.nullable().optional(),
	phase: z.enum([
		"recommendation",
		"pre_cooking",
		"active_cooking",
		"completion",
	]),
	session: ActiveCookingSessionSchema,
	recommendationSnapshot: CookingRecommendationOutputSchema,
	selectedRecipeSnapshot: CookingRecommendationSchema,
	cookingPlan: ActiveCookingPlanSessionSchema.shape.cookingPlan,
	completionSnapshot: CompletionOutputSchema.nullable(),
	nutritionSnapshot: RecipeNutritionResultSchema.nullable(),
	startedAt: z.string().datetime({ offset: true }),
	completedAt: z.string().datetime({ offset: true }).nullable(),
	createdAt: z.string().datetime({ offset: true }),
	updatedAt: z.string().datetime({ offset: true }),
});

export type CookingSessionResponse = z.infer<
	typeof CookingSessionResponseSchema
>;

export const ResumableCookingSessionResponseSchema = z
	.object({
		session: CookingSessionResponseSchema.nullable(),
	})
	.strict();

export type ResumableCookingSessionResponse = z.infer<
	typeof ResumableCookingSessionResponseSchema
>;
