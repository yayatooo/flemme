/** Composition boundary for the Flemme cooking agent runtime. */
import { generateCompletion } from "@anvia/core";
import { createOpenAIModel } from "../providers";
import { createRecommendationPrompt } from "../intents/cooking-recommendation";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunCookingAgentInput {
	model: CookingModel;
	input: string;
}

export async function runCookingAgent({
	model,
	input,
}: RunCookingAgentInput) {
	const prompt = createRecommendationPrompt(input);

	return generateCompletion({
		model,
		prompt,
	});
}
