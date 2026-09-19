import { describe, expect, test } from "bun:test";

import {
	isRecommendationTraceSampled,
	parseRecommendationTrace,
	parseRuntimeTrace,
	RECOMMENDATION_INPUT_SCHEMA_VERSION,
	RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
	RECOMMENDATION_PROMPT_VERSION,
	RECOMMENDATION_TRACE_NAME,
	type RecommendationTrace,
	RUNTIME_PHASE_CONFIG,
	type RuntimePhase,
	serializeRecommendationTrace,
} from "./recommendation-observability";

const SAFE_TRACE = {
	traceId: "0123456789abcdef0123456789abcdef",
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
	totalDurationMs: 12.5,
	modelDurationMs: 12,
	inputTokens: 11,
	outputTokens: 7,
	samplingDecision: true as const,
} satisfies RecommendationTrace;

describe("Recommendation trace contract", () => {
	test("accepts and serializes only the explicit metadata allowlist", () => {
		const serialized = serializeRecommendationTrace(SAFE_TRACE);

		expect(JSON.parse(serialized)).toEqual(SAFE_TRACE);
		expect(serialized).not.toContain("inventory");
		expect(serialized).not.toContain("private ingredient");
		expect(serialized).not.toContain("private cooking result");
	});

	test("rejects unknown and forbidden content fields", () => {
		expect(() =>
			parseRecommendationTrace({
				...SAFE_TRACE,
				inventory: ["private ingredient"],
			}),
		).toThrow();
		expect(() =>
			parseRecommendationTrace({
				...SAFE_TRACE,
				rawOutput: "private cooking result",
			}),
		).toThrow();
	});

	test("accepts only the sanitized failure code", () => {
		const { resultVariant: _, ...base } = SAFE_TRACE;
		expect(
			parseRecommendationTrace({
				...base,
				status: "failure",
				errorCode: "recommendation_runtime_failed",
			}),
		).toMatchObject({ status: "failure" });
		expect(() =>
			parseRecommendationTrace({
				...base,
				status: "failure",
				errorCode: "provider said private request failed",
			}),
		).toThrow();
	});
});

describe("Four-phase runtime trace contract", () => {
	test("accepts four and only four phase identity mappings", () => {
		expect(Object.keys(RUNTIME_PHASE_CONFIG)).toEqual([
			"recommendation",
			"pre-cooking",
			"active-cooking",
			"completion",
		]);
		for (const phase of Object.keys(RUNTIME_PHASE_CONFIG) as RuntimePhase[]) {
			const config = RUNTIME_PHASE_CONFIG[phase];
			const trace = parseRuntimeTrace({
				...SAFE_TRACE,
				phase,
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
			expect(trace.phase).toBe(phase);
		}
	});

	test("rejects mismatched names, unsafe enums, unknown fields, and raw errors", () => {
		expect(() =>
			parseRuntimeTrace({
				...SAFE_TRACE,
				traceName: "flemme.runtime.completion",
			}),
		).toThrow();
		expect(() =>
			parseRuntimeTrace({ ...SAFE_TRACE, executionPath: "remote" }),
		).toThrow();
		expect(() =>
			parseRuntimeTrace({ ...SAFE_TRACE, modelIdentifier: "secret-value" }),
		).toThrow();
		expect(() =>
			parseRuntimeTrace({ ...SAFE_TRACE, message: "private message" }),
		).toThrow();
		expect(() =>
			parseRuntimeTrace({
				...SAFE_TRACE,
				status: "failure",
				resultVariant: undefined,
				errorCode: "private provider error",
				stack: "private stack",
			}),
		).toThrow();
	});
});

describe("Recommendation sampling", () => {
	test("sample rate zero excludes and one includes", () => {
		expect(isRecommendationTraceSampled(SAFE_TRACE.traceId, 0)).toBe(false);
		expect(isRecommendationTraceSampled(SAFE_TRACE.traceId, 1)).toBe(true);
	});

	test("uses deterministic trace-ID sampling", () => {
		const lowTraceId = "00000000ffffffffffffffffffffffff";
		const highTraceId = "ffffffff000000000000000000000000";
		expect(isRecommendationTraceSampled(lowTraceId, 0.5)).toBe(true);
		expect(isRecommendationTraceSampled(highTraceId, 0.5)).toBe(false);
		expect(isRecommendationTraceSampled(lowTraceId, 0.5)).toBe(true);
	});
});
