import { z } from "zod";

import { CookingRecommendationInputSchema } from "./cooking-recommendation-input";
import { CookingRecommendationSchema } from "./cooking-recommendation-output";

export const PreCookingInputSchema = z.object({
	selectedRecipe: CookingRecommendationSchema,
	context: CookingRecommendationInputSchema,
});

export type PreCookingInput = z.infer<typeof PreCookingInputSchema>;
