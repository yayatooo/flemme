import { type CompletionModel, Usage } from "@anvia/core";
import {
	activeCookingInput,
	BASE_PRE_COOKING_INPUT,
	BASE_RECOMMENDATION_CONTEXT,
	completionInput,
} from "../evals/fixtures/cooking-context";
import {
	createRuntimeTraceObserver,
	readRuntimeObservabilityConfig,
	runActiveCooking,
	runCompletion,
	runCookingAgent,
	runPreCooking,
} from "../index";
import { AYAM_KECAP_COOKING_PLAN } from "../src/fixtures/ayam-kecap-cooking-plan";

const recommendationOutput = {
	type: "clarification" as const,
	question: "Synthetic clarification?",
	reason: "Synthetic canary result.",
};
const completionOutput = {
	reply: "Synthetic completion reply.",
	summary: {
		title: "Synthetic completion",
		description: "Synthetic completion summary.",
	},
	notes: [],
};

function syntheticModel(
	modelId: string,
	output: unknown,
): CompletionModel<null> {
	return {
		provider: "flemme-synthetic",
		modelId,
		capabilities: {
			streaming: false,
			tools: false,
			toolChoice: false,
			imageInput: false,
			documentInput: false,
			outputSchema: true,
			reasoning: false,
		},
		async completion() {
			return {
				choice: [{ type: "text", text: JSON.stringify(output) }],
				usage: {
					...Usage.empty(),
					inputTokens: 11,
					outputTokens: 7,
					totalTokens: 18,
				},
				finishReason: "stop",
				rawResponse: null,
			};
		},
	};
}

async function run() {
	const config = readRuntimeObservabilityConfig(Bun.env);
	if (!config.enabled || config.sampleRate !== 1 || !config.syntheticCanary) {
		throw new Error("runtime_canary_configuration");
	}
	const observability = createRuntimeTraceObserver(config);

	await runCookingAgent({
		model: syntheticModel("synthetic-recommendation-v1", recommendationOutput),
		context: BASE_RECOMMENDATION_CONTEXT,
		observability,
	});
	await runPreCooking({
		model: syntheticModel("synthetic-pre-cooking-v1", AYAM_KECAP_COOKING_PLAN),
		input: BASE_PRE_COOKING_INPUT,
		observability,
	});
	await runActiveCooking({
		model: syntheticModel("deterministic-local", null),
		input: activeCookingInput("What is the weather tomorrow?"),
		observability,
	});
	await runCompletion({
		model: syntheticModel("synthetic-completion-v1", completionOutput),
		input: completionInput("Synthetic cooking is complete."),
		observability,
	});

	await observability.flush();
}

try {
	await run();
} catch {
	console.error("runtime_canary_status=failed");
	process.exitCode = 1;
}
