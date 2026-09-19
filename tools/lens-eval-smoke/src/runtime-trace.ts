import type {
	AgentObserver,
	AgentRunObserver,
} from "@anvia/core/observability";

import type { RecommendationTrace } from "../../../packages/agent/src/observability/recommendation-observability.ts";

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const OBSERVATION_ID_PATTERN = /^[0-9a-f]{16}$/;

export interface RuntimeTraceReceipt {
	traceId: string;
	observationId: string;
}

export async function publishRecommendationRuntimeTrace(
	observer: AgentObserver,
	trace: RecommendationTrace,
): Promise<RuntimeTraceReceipt> {
	const run = await observer.startRun({
		runId: trace.traceId,
		agentName: "flemme-recommendation",
		trace: {
			name: trace.traceName,
			...(trace.release ? { version: trace.release } : {}),
			metadata: runtimeTraceMetadata(trace),
		},
		prompt: { role: "user", content: "" },
		history: [],
		maxTurns: 1,
	});
	if (!run) throw new Error("runtime_trace_start_failed");

	const receipt = traceReceipt(run);
	await endRuntimeTrace(run, trace);
	return receipt;
}

export async function publishRecommendationRuntimeTraceAndFlush(
	observer: AgentObserver,
	trace: RecommendationTrace,
	flush: () => Promise<void>,
): Promise<RuntimeTraceReceipt> {
	const receipt = await publishRecommendationRuntimeTrace(observer, trace);
	await flush();
	return receipt;
}

export function runtimeTraceMetadata(trace: RecommendationTrace) {
	return {
		phase: trace.phase,
		promptVersion: trace.promptVersion,
		inputSchemaVersion: trace.inputSchemaVersion,
		outputSchemaVersion: trace.outputSchemaVersion,
		modelIdentifier: trace.modelIdentifier,
		status: trace.status,
		totalDurationMs: trace.totalDurationMs,
		...(trace.modelDurationMs === undefined
			? {}
			: { modelDurationMs: trace.modelDurationMs }),
		...(trace.inputTokens === undefined
			? {}
			: { inputTokens: trace.inputTokens }),
		...(trace.outputTokens === undefined
			? {}
			: { outputTokens: trace.outputTokens }),
		samplingDecision: trace.samplingDecision,
		...(trace.status === "success"
			? { resultVariant: trace.resultVariant }
			: { errorCode: trace.errorCode }),
	};
}

function traceReceipt(run: AgentRunObserver): RuntimeTraceReceipt {
	const traceId = run.trace?.traceId;
	const observationId = run.trace?.observationId;
	if (
		!traceId ||
		!TRACE_ID_PATTERN.test(traceId) ||
		!observationId ||
		!OBSERVATION_ID_PATTERN.test(observationId)
	) {
		throw new Error("runtime_trace_identity_missing");
	}
	return { traceId, observationId };
}

async function endRuntimeTrace(
	run: AgentRunObserver,
	trace: RecommendationTrace,
) {
	const usage = {
		inputTokens: trace.inputTokens ?? 0,
		outputTokens: trace.outputTokens ?? 0,
		totalTokens: (trace.inputTokens ?? 0) + (trace.outputTokens ?? 0),
		cachedInputTokens: 0,
		cacheCreationInputTokens: 0,
	};
	if (trace.status === "success") {
		await run.end({
			runId: trace.traceId,
			status: "completed",
			text: "",
			output: null,
			usage,
			messages: [],
		});
		return;
	}
	if (!run.error) throw new Error("runtime_trace_error_end_missing");
	await run.error({
		status: "failed",
		error: new Error(trace.errorCode),
		usage,
		messages: [],
	});
}
