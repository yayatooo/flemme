import { OpenAIClient } from "@anvia/openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL_ID = "deepseek/deepseek-v4.1-flash";

export interface OpenRouterModelConfig {
	apiKey: string;
	modelId?: string;
}

/** Creates the OpenRouter completion model used by the Anvia agent runtime. */
export function createOpenRouterModel({
	apiKey,
	modelId = DEFAULT_MODEL_ID,
}: OpenRouterModelConfig) {
	const client = new OpenAIClient({
		apiKey,
		baseUrl: OPENROUTER_BASE_URL,
	});

	return client.completionModel({
		modelId,
		api: "chat",
	});
}
