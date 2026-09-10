import { runCookingRecommendation } from "../intents/cooking-recommendation";
import { createOpenAIModel } from "../providers";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunCookingAgentInput {
	model: CookingModel;
	context: string;
}

export function runCookingAgent({
	model,
	context,
}: RunCookingAgentInput) {
	return runCookingRecommendation({
		model,
		context,
	});
}
