import {
	CookingRecommendationSchema,
	PreCookingOutputSchema,
} from "@flemme/agent";
import { z } from "@hono/zod-openapi";

import { CookingRecommendationRequestSchema } from "../cooking-recommendation/cooking-recommendation-schema";

export const PreCookingRequestSchema = z.object({
	selectedRecipe: CookingRecommendationSchema,
	...CookingRecommendationRequestSchema.shape,
});

export type PreCookingRequest = z.infer<typeof PreCookingRequestSchema>;

export const PreCookingResponseSchema = PreCookingOutputSchema;

export type PreCookingResponse = z.infer<typeof PreCookingResponseSchema>;
