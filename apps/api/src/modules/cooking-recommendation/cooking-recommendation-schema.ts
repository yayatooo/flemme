import {
	CookingRecommendationInputSchema,
	CookingRecommendationOutputSchema,
} from "@flemme/agent";
import { z } from "@hono/zod-openapi";

const NonEmptyStringSchema = z.string().trim().min(1);

const RecommendationInventoryItemSchema = z.object({
	...CookingRecommendationInputSchema.shape.inventory.element.shape,
	name: NonEmptyStringSchema,
	quantity: NonEmptyStringSchema.optional(),
});

const RecommendationKitchenSchema = z.object({
	...CookingRecommendationInputSchema.shape.kitchen.shape,
	equipment: z.array(NonEmptyStringSchema),
});

const RecommendationHouseholdSchema = z.object({
	...CookingRecommendationInputSchema.shape.household.shape,
});

const RecommendationSessionSchema = z.object({
	...CookingRecommendationInputSchema.shape.session.shape,
	request: NonEmptyStringSchema.optional(),
});

export const CookingRecommendationRequestSchema = z.object({
	inventory: z.array(RecommendationInventoryItemSchema).optional().openapi({
		description:
			"Current-attempt inventory override. When omitted, persisted inventory is used.",
	}),
	kitchen: RecommendationKitchenSchema.optional().openapi({
		description:
			"Current-attempt kitchen override. When omitted, persisted equipment is used.",
	}),
	household: RecommendationHouseholdSchema.optional().openapi({
		description:
			"Current-attempt household override. When omitted, persisted household counts are used.",
	}),
	foodPreferences: z.array(NonEmptyStringSchema).optional().openapi({
		description:
			"Current-attempt food preference override. Replaces persisted preferences for this request.",
	}),
	cookingPreferences: z.array(NonEmptyStringSchema).optional().openapi({
		description:
			"Current-attempt cooking preference override. Replaces persisted preferences for this request.",
	}),
	session: RecommendationSessionSchema.openapi({
		description: "Constraints and intent specific to this cooking attempt.",
		example: {
			request: "I want a simple savory dinner.",
			servings: 2,
			availableMinutes: 45,
		},
	}),
});

export type CookingRecommendationRequest = z.infer<
	typeof CookingRecommendationRequestSchema
>;

export const CookingRecommendationResponseSchema =
	CookingRecommendationOutputSchema;

export type CookingRecommendationResponse = z.infer<
	typeof CookingRecommendationResponseSchema
>;
