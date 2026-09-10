import { generateCompletion } from "@anvia/core";

import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import { createCookingRecommendationPrompt } from "../prompts/recommendation";
import type { createOpenAIModel } from "../providers";
import type { CookingRecommendationInput } from "../schemas/cooking-recommendation-input";
import {
	type CookingRecommendationOutput,
	CookingRecommendationOutputSchema,
} from "../schemas/cooking-recommendation-output";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunCookingRecommendationInput {
	model: CookingModel;
	context: CookingRecommendationInput;
}

export async function runCookingRecommendation({
	model,
	context,
}: RunCookingRecommendationInput): Promise<CookingRecommendationOutput> {
	const recommendationPrompt = createCookingRecommendationPrompt(context);

	const prompt = `
${COOKING_INSTRUCTIONS}

${recommendationPrompt}
`.trim();

	const result = await generateCompletion({
		model,
		prompt,
		outputSchema: CookingRecommendationOutputSchema,
	});

	return result.output;
}
