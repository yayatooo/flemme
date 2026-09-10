import { runCookingRecommendation } from "../intents/cooking-recommendation";
import type { createOpenAIModel } from "../providers";
import type { CookingRecommendationInput } from "../schemas/cooking-recommendation-input";
import type { CookingRecommendationOutput } from "../schemas/cooking-recommendation-output";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunCookingAgentInput {
	model: CookingModel;
	context: CookingRecommendationInput;
}

export function runCookingAgent({
	model,
	context,
}: RunCookingAgentInput): Promise<CookingRecommendationOutput> {
	return runCookingRecommendation({
		model,
		context,
	});
}
