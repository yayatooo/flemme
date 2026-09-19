import { type CompletionModel, Usage } from "@anvia/core";

import {
	createRecommendationTraceObserver,
	readRecommendationObservabilityConfig,
	runCookingAgent,
} from "../index";

const SYNTHETIC_OUTPUT = {
	type: "recommendations" as const,
	recommendations: [
		{
			name: "Synthetic Test Bowl",
			description: "A deterministic fake-model result for local tracing.",
			reason: "Exercises the Recommendation runtime without a provider call.",
			estimatedDuration: { minMinutes: 10, maxMinutes: 10 },
			servings: 1,
			feasibility: "ready" as const,
			ingredients: [
				{
					name: "synthetic ingredient",
					status: "available" as const,
					requiredAmount: "1 synthetic unit",
				},
			],
			equipment: [{ name: "synthetic pan", status: "available" as const }],
			preferenceMatches: [],
			requiredConfirmations: [],
			optionalIngredients: [],
			warnings: [],
		},
	],
};

const syntheticModel: CompletionModel<null> = {
	provider: "flemme-synthetic",
	modelId: "synthetic-static-v1",
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
			choice: [{ type: "text", text: JSON.stringify(SYNTHETIC_OUTPUT) }],
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

async function run() {
	const config = readRecommendationObservabilityConfig(Bun.env);
	if (!config.enabled || config.sampleRate !== 1) {
		throw new Error("runtime_canary_configuration");
	}
	const observability = createRecommendationTraceObserver(config);

	const result = await runCookingAgent({
		model: syntheticModel,
		context: {
			inventory: [
				{
					name: "synthetic ingredient",
					quantity: "1 synthetic unit",
					condition: "fresh",
				},
			],
			kitchen: { equipment: ["synthetic pan"] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: ["synthetic preference"],
			cookingPreferences: ["synthetic cooking preference"],
			session: {
				request: "Create the deterministic synthetic test meal.",
				servings: 1,
				availableMinutes: 10,
			},
		},
		observability,
	});

	if (result.type !== "recommendations") {
		throw new Error("runtime_canary_result");
	}
	await observability.flush();
}

try {
	await run();
} catch {
	console.error("runtime_canary_status=failed");
	process.exitCode = 1;
}
