import type { CompletionModel } from "@anvia/core";

import { runCookingRecommendationWithMetadata } from "../intents/cooking-recommendation";
import {
	createRecommendationTraceId,
	RECOMMENDATION_INPUT_SCHEMA_VERSION,
	RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
	RECOMMENDATION_PROMPT_VERSION,
	RECOMMENDATION_TRACE_NAME,
	type RecommendationTrace,
	type RecommendationTraceObserver,
} from "../observability/recommendation-observability";
import type { CookingRecommendationInput } from "../schemas/cooking-recommendation-input";
import type { CookingRecommendationOutput } from "../schemas/cooking-recommendation-output";

interface RunCookingAgentInput {
	model: CompletionModel;
	context: CookingRecommendationInput;
	observability?: RecommendationTraceObserver;
}

export async function runCookingAgent({
	model,
	context,
	observability,
}: RunCookingAgentInput): Promise<CookingRecommendationOutput> {
	const traceId = createRecommendationTraceId();
	const sampled = observability?.shouldSample(traceId) ?? false;
	const startedAt = performance.now();

	try {
		const result = await runCookingRecommendationWithMetadata({
			model,
			context,
		});
		if (sampled && observability) {
			recordFailOpen(observability, {
				...traceBase(
					observability,
					traceId,
					model.modelId,
					performance.now() - startedAt,
					result.modelDurationMs,
					result.inputTokens,
					result.outputTokens,
				),
				status: "success",
				resultVariant: result.output.type,
			});
		}
		return result.output;
	} catch (error) {
		if (sampled && observability) {
			recordFailOpen(observability, {
				...traceBase(
					observability,
					traceId,
					model.modelId,
					performance.now() - startedAt,
				),
				status: "failure",
				errorCode: "recommendation_runtime_failed",
			});
		}
		throw error;
	}
}

function traceBase(
	observability: RecommendationTraceObserver,
	traceId: string,
	modelIdentifier: string,
	totalDurationMs: number,
	modelDurationMs?: number,
	inputTokens?: number,
	outputTokens?: number,
) {
	return {
		traceId,
		traceName: RECOMMENDATION_TRACE_NAME,
		serviceName: observability.serviceName,
		environment: observability.environment,
		phase: "recommendation" as const,
		promptVersion: RECOMMENDATION_PROMPT_VERSION,
		inputSchemaVersion: RECOMMENDATION_INPUT_SCHEMA_VERSION,
		outputSchemaVersion: RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
		modelIdentifier,
		totalDurationMs,
		...(modelDurationMs === undefined ? {} : { modelDurationMs }),
		...(inputTokens === undefined ? {} : { inputTokens }),
		...(outputTokens === undefined ? {} : { outputTokens }),
		samplingDecision: true as const,
		...(observability.release ? { release: observability.release } : {}),
	} as const;
}

function recordFailOpen(
	observability: RecommendationTraceObserver,
	trace: RecommendationTrace,
) {
	try {
		observability.record(trace);
	} catch {
		console.warn("recommendation_observability=record_failed");
	}
}
