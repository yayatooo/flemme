import {
	ActiveCookingPlanSessionSchema,
	ActiveCookingSessionSchema,
	CompletionOutputSchema,
	CookingRecommendationOutputSchema,
	CookingRecommendationSchema,
} from "@flemme/agent";
import { RecipeNutritionResultSchema } from "@flemme/nutrition";
import { z } from "@hono/zod-openapi";

export const CookingSessionIdSchema = z.string().uuid();

export const CookingSessionParamsSchema = z.object({
	id: CookingSessionIdSchema.openapi({
		param: {
			name: "id",
			in: "path",
		},
		description: "Cooking session UUID",
	}),
});

export const CreateCookingSessionRequestSchema =
	ActiveCookingPlanSessionSchema.safeExtend({
		recommendationSnapshot: CookingRecommendationOutputSchema,
		selectedRecipeSnapshot: CookingRecommendationSchema,
		nutritionSnapshot: RecipeNutritionResultSchema.optional(),
	}).superRefine(({ session }, context) => {
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

export const UpdateCookingProgressRequestSchema = z.object({
	session: ActiveCookingSessionSchema,
});

export type UpdateCookingProgressRequest = z.infer<
	typeof UpdateCookingProgressRequestSchema
>;

export const CompleteCookingSessionRequestSchema = z.object({
	completionSnapshot: CompletionOutputSchema,
	nutritionSnapshot: RecipeNutritionResultSchema.optional(),
});

export type CompleteCookingSessionRequest = z.infer<
	typeof CompleteCookingSessionRequestSchema
>;

export const CookingSessionResponseSchema = z.object({
	id: CookingSessionIdSchema,
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
