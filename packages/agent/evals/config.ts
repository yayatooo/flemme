import { createOpenAIModel } from "../src/providers";

const DEFAULT_EVAL_MODEL_ID = "gpt-5.6-luna";

function requiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];
	if (!value) {
		throw new Error(
			`Eval configuration error: ${name} is required. Load the repository .env file or set ${name} before running live evals.`,
		);
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
	return createOpenAIModel({
		apiKey: requiredEnvironmentVariable("MUX_API_KEY"),
		baseUrl: requiredEnvironmentVariable("BASE_URL"),
		modelId,
	});
}
