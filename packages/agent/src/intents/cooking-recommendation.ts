import { generateCompletion } from "@anvia/core";

import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import { createCookingRecommendationPrompt } from "../prompts/recommendation";
import { createOpenAIModel } from "../providers";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunCookingRecommendationInput {
	model: CookingModel;
	context: string;
}

export async function runCookingRecommendation({
	model,
	context,
}: RunCookingRecommendationInput) {
	const recommendationPrompt = createCookingRecommendationPrompt(context);

	const prompt = `
${COOKING_INSTRUCTIONS}

${recommendationPrompt}
`.trim();

	return generateCompletion({
		model,
		prompt,
	});
}
