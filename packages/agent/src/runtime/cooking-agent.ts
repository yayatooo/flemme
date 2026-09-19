import type { CompletionModel } from "@anvia/core";

import { runCookingRecommendationWithMetadata } from "../intents/cooking-recommendation";
import {
	observeRuntimeExecution,
	type RuntimeTraceObserver,
} from "../observability/recommendation-observability";
import type { CookingRecommendationInput } from "../schemas/cooking-recommendation-input";
import type { CookingRecommendationOutput } from "../schemas/cooking-recommendation-output";

interface RunCookingAgentInput {
	model: CompletionModel;
	context: CookingRecommendationInput;
	observability?: RuntimeTraceObserver;
}

export async function runCookingAgent({
	model,
	context,
	observability,
}: RunCookingAgentInput): Promise<CookingRecommendationOutput> {
	return observeRuntimeExecution({
		phase: "recommendation",
		modelIdentifier: model.modelId,
		observability,
		execute: async () => {
			const result = await runCookingRecommendationWithMetadata({
				model,
				context,
			});
			return {
				...result,
				resultVariant: result.output.type,
				executionPath: "model" as const,
			};
		},
	});
}
