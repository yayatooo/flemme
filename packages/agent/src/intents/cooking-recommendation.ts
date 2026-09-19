import { type CompletionModel, generateCompletion } from "@anvia/core";

import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import { createCookingRecommendationPrompt } from "../prompts/recommendation";
import type { CookingRecommendationInput } from "../schemas/cooking-recommendation-input";
import {
	type CookingRecommendationOutput,
	CookingRecommendationOutputSchema,
} from "../schemas/cooking-recommendation-output";

interface RunCookingRecommendationInput {
	model: CompletionModel;
	context: CookingRecommendationInput;
}

export interface CookingRecommendationRuntimeResult {
	output: CookingRecommendationOutput;
	modelDurationMs: number;
	inputTokens: number;
	outputTokens: number;
}

export async function runCookingRecommendation({
	model,
	context,
}: RunCookingRecommendationInput): Promise<CookingRecommendationOutput> {
	return (await runCookingRecommendationWithMetadata({ model, context }))
		.output;
}

export async function runCookingRecommendationWithMetadata({
	model,
	context,
}: RunCookingRecommendationInput): Promise<CookingRecommendationRuntimeResult> {
	const recommendationPrompt = createCookingRecommendationPrompt(context);

	const prompt = `
${COOKING_INSTRUCTIONS}

${recommendationPrompt}
`.trim();

	const modelStartedAt = performance.now();
	const result = await generateCompletion({
		model,
		prompt,
		outputSchema: CookingRecommendationOutputSchema,
	});

	return {
		output: result.output,
		modelDurationMs: performance.now() - modelStartedAt,
		inputTokens: result.usage.inputTokens,
		outputTokens: result.usage.outputTokens,
	};
}
