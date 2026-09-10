import { OpenAIClient } from "@anvia/openai";

const DEFAULT_MODEL_ID = "glm-5.3-flash";

export interface OpenAIModelConfig {
	apiKey: string;
	baseUrl: string;
	modelId?: string;
}

/** Creates the OpenAI-compatible completion model used by the agent runtime. */
export function createOpenAIModel({
	apiKey,
	baseUrl,
	modelId = DEFAULT_MODEL_ID,
}: OpenAIModelConfig) {
	const client = new OpenAIClient({
		apiKey,
		baseUrl,
	});

	return client.completionModel({
		modelId,
		api: "chat",
	});
}
