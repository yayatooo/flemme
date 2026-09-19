import assert from "node:assert/strict";
import test from "node:test";

import type { AgentObserver } from "@anvia/core/observability";

import {
	RECOMMENDATION_INPUT_SCHEMA_VERSION,
	RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
	RECOMMENDATION_PROMPT_VERSION,
	RECOMMENDATION_TRACE_NAME,
	type RecommendationTrace,
	RUNTIME_PHASE_CONFIG,
} from "../../../packages/agent/src/observability/recommendation-observability.ts";
import {
	publishRecommendationRuntimeTraceAndFlush,
	publishRuntimeTrace,
	runtimeTraceMetadata,
} from "./runtime-trace.ts";

const CONTRACT_TRACE_ID = "0123456789abcdef0123456789abcdef";
const LENS_TRACE_ID = "fedcba9876543210fedcba9876543210";
const LENS_OBSERVATION_ID = "fedcba9876543210";

const TRACE = {
	traceId: CONTRACT_TRACE_ID,
	traceName: RECOMMENDATION_TRACE_NAME,
	spanName: "agent.flemme-recommendation",
	serviceName: "flemme-agent",
	environment: "local",
	phase: "recommendation" as const,
	operationName: "recommend-meal",
	promptVersion: RECOMMENDATION_PROMPT_VERSION,
	inputSchemaVersion: RECOMMENDATION_INPUT_SCHEMA_VERSION,
	outputSchemaVersion: RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
	modelIdentifier: "synthetic-static-v1",
	executionPath: "model" as const,
	resultVariant: "recommendations" as const,
	status: "success" as const,
	totalDurationMs: 12,
	modelDurationMs: 11,
	inputTokens: 4,
	outputTokens: 3,
	samplingDecision: true as const,
} satisfies RecommendationTrace;

test("ends the SDK root span before flush without injecting a remote parent", async () => {
	const lifecycle: string[] = [];
	let startArguments: Parameters<AgentObserver["startRun"]>[0] | undefined;
	let endArguments: unknown;
	const observer: AgentObserver = {
		startRun(args) {
			lifecycle.push("start");
			startArguments = args;
			return {
				trace: {
					traceId: LENS_TRACE_ID,
					observationId: LENS_OBSERVATION_ID,
				},
				end: (args) => {
					lifecycle.push("end");
					endArguments = args;
				},
			};
		},
	};

	const receipt = await publishRecommendationRuntimeTraceAndFlush(
		observer,
		TRACE,
		async () => {
			lifecycle.push("flush");
		},
	);
	lifecycle.push("close");

	assert.deepEqual(lifecycle, ["start", "end", "flush", "close"]);
	assert.deepEqual(receipt, {
		traceId: LENS_TRACE_ID,
		observationId: LENS_OBSERVATION_ID,
	});
	assert.equal(startArguments?.trace?.traceId, undefined);
	assert.equal(startArguments?.trace?.parentObservationId, undefined);
	assert.equal(startArguments?.trace?.name, RECOMMENDATION_TRACE_NAME);
	assert.deepEqual(startArguments?.prompt, { role: "user", content: "" });
	assert.deepEqual(startArguments?.history, []);
	assert.deepEqual(endArguments, {
		runId: CONTRACT_TRACE_ID,
		status: "completed",
		text: "",
		output: null,
		usage: {
			inputTokens: 4,
			outputTokens: 3,
			totalTokens: 7,
			cachedInputTokens: 0,
			cacheCreationInputTokens: 0,
		},
		messages: [],
	});
});

test("maps all four approved phases without a synthetic remote parent", async () => {
	for (const [phase, config] of Object.entries(RUNTIME_PHASE_CONFIG)) {
		let startArguments: Parameters<AgentObserver["startRun"]>[0] | undefined;
		const observer: AgentObserver = {
			startRun(args) {
				startArguments = args;
				return {
					trace: {
						traceId: LENS_TRACE_ID,
						observationId: LENS_OBSERVATION_ID,
					},
					end: () => undefined,
				};
			},
		};
		await publishRuntimeTrace(observer, {
			...TRACE,
			phase: phase as keyof typeof RUNTIME_PHASE_CONFIG,
			traceName: config.traceName,
			spanName: config.spanName,
			operationName: config.operationName,
			promptVersion: config.promptVersion,
			inputSchemaVersion: config.inputSchemaVersion,
			outputSchemaVersion: config.outputSchemaVersion,
			resultVariant: config.resultVariants[0],
			executionPath: phase === "active-cooking" ? "local" : "model",
			...(phase === "active-cooking"
				? {
						modelIdentifier: "deterministic-local",
						modelDurationMs: undefined,
						inputTokens: undefined,
						outputTokens: undefined,
					}
				: {}),
		});
		assert.equal(startArguments?.agentName, config.spanName.slice(6));
		assert.equal(startArguments?.trace?.name, config.traceName);
		assert.equal(startArguments?.trace?.traceId, undefined);
		assert.equal(startArguments?.trace?.parentObservationId, undefined);
	}
});

test("emits a terminal failed run with only the sanitized error code", async () => {
	let errorArguments: unknown;
	const observer: AgentObserver = {
		startRun() {
			return {
				trace: {
					traceId: LENS_TRACE_ID,
					observationId: LENS_OBSERVATION_ID,
				},
				end: () => undefined,
				error: (args) => {
					errorArguments = args;
				},
			};
		},
	};
	const { resultVariant: _, ...base } = TRACE;
	await publishRuntimeTrace(observer, {
		...base,
		status: "failure",
		errorCode: "recommendation_runtime_failed",
	});
	assert.equal((errorArguments as { status?: string }).status, "failed");
	assert.equal(
		(errorArguments as { error?: Error }).error?.message,
		"recommendation_runtime_failed",
	);
});

test("publishes only the Flemme runtime metadata allowlist", () => {
	assert.deepEqual(Object.keys(runtimeTraceMetadata(TRACE)).sort(), [
		"executionPath",
		"inputSchemaVersion",
		"inputTokens",
		"modelDurationMs",
		"modelIdentifier",
		"operationName",
		"outputSchemaVersion",
		"outputTokens",
		"phase",
		"promptVersion",
		"resultVariant",
		"samplingDecision",
		"spanName",
		"status",
		"totalDurationMs",
	]);
	assert.doesNotMatch(
		JSON.stringify(runtimeTraceMetadata(TRACE)),
		/recipe|ingredient|instruction|prompt text|user content/i,
	);
});
