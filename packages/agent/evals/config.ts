import { createOpenRouterModel } from "../src/providers";

const DEFAULT_EVAL_MODEL_ID = "deepseek/deepseek-v4.1-flash";

function requiredOpenRouterApiKey() {
	const value = Bun.env.OPENROUTER_API_KEY ?? Bun.env.OPEN_API_KEY;

	if (!value) {
		throw new Error("OPENROUTER_API_KEY is required");
	}

	return value;
}

export function evalModelId() {
	return Bun.env.FLEMME_EVAL_MODEL_ID || DEFAULT_EVAL_MODEL_ID;
}

export function judgeModelId() {
	return Bun.env.FLEMME_EVAL_JUDGE_MODEL_ID || evalModelId();
}

export function createEvalModel(modelId = evalModelId()) {
	return createOpenRouterModel({
		apiKey: requiredOpenRouterApiKey(),
		modelId,
	});
}
