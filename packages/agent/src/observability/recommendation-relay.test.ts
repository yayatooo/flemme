import { describe, expect, test } from "bun:test";

import {
	RECOMMENDATION_INPUT_SCHEMA_VERSION,
	RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
	RECOMMENDATION_PROMPT_VERSION,
	RECOMMENDATION_TRACE_NAME,
	type RecommendationTrace,
} from "./recommendation-observability";
import {
	createRecommendationTraceObserver,
	readRecommendationObservabilityConfig,
} from "./recommendation-relay";

const TRACE = {
	traceId: "0123456789abcdef0123456789abcdef",
	traceName: RECOMMENDATION_TRACE_NAME,
	serviceName: "flemme-agent",
	environment: "local",
	phase: "recommendation" as const,
	promptVersion: RECOMMENDATION_PROMPT_VERSION,
	inputSchemaVersion: RECOMMENDATION_INPUT_SCHEMA_VERSION,
	outputSchemaVersion: RECOMMENDATION_OUTPUT_SCHEMA_VERSION,
	modelIdentifier: "synthetic-static-v1",
	resultVariant: "recommendations" as const,
	status: "success" as const,
	totalDurationMs: 12,
	modelDurationMs: 11,
	inputTokens: 4,
	outputTokens: 3,
	samplingDecision: true as const,
} satisfies RecommendationTrace;

describe("Recommendation observability configuration", () => {
	test("is disabled with zero sampling by default and needs no credentials", () => {
		const config = readRecommendationObservabilityConfig({});
		const observer = createRecommendationTraceObserver(config);

		expect(config).toMatchObject({ enabled: false, sampleRate: 0 });
		expect(observer.shouldSample(TRACE.traceId)).toBe(false);
		expect(observer.flush()).resolves.toBeUndefined();
	});

	test("rejects invalid values and non-loopback relay URLs", () => {
		expect(() =>
			readRecommendationObservabilityConfig({
				FLEMME_OBSERVABILITY_ENABLED: "yes",
			}),
		).toThrow("enabled");
		expect(() =>
			readRecommendationObservabilityConfig({
				FLEMME_OBSERVABILITY_SAMPLE_RATE: "2",
			}),
		).toThrow("sample_rate");
		expect(() =>
			readRecommendationObservabilityConfig({
				FLEMME_OBSERVABILITY_RELAY_URL:
					"https://telemetry.example/v1/recommendation-traces",
			}),
		).toThrow("relay_url_not_loopback");
	});
});

describe("Recommendation relay failure isolation", () => {
	const enabledConfig = readRecommendationObservabilityConfig({
		FLEMME_OBSERVABILITY_ENABLED: "true",
		FLEMME_OBSERVABILITY_SAMPLE_RATE: "1",
		FLEMME_OBSERVABILITY_RELAY_URL:
			"http://127.0.0.1:18081/v1/recommendation-traces",
		FLEMME_OBSERVABILITY_TIMEOUT_MS: "5",
	});

	test("reports relay rejection only at explicit flush", async () => {
		const diagnostics: string[] = [];
		const observer = createRecommendationTraceObserver(enabledConfig, {
			fetch: async () => new Response(null, { status: 503 }),
			diagnostic: (code) => diagnostics.push(code),
		});

		expect(() => observer.record(TRACE)).not.toThrow();
		await expect(observer.flush()).rejects.toThrow("relay_rejected");
		expect(diagnostics).toEqual(["relay_rejected"]);
	});

	test("bounds timeouts and reports them only at explicit flush", async () => {
		const diagnostics: string[] = [];
		const observer = createRecommendationTraceObserver(enabledConfig, {
			fetch: (_input, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () =>
						reject(new Error("abort")),
					);
				}),
			diagnostic: (code) => diagnostics.push(code),
		});

		expect(() => observer.record(TRACE)).not.toThrow();
		await expect(observer.flush()).rejects.toThrow("relay_unavailable");
		expect(diagnostics).toEqual(["relay_unavailable"]);
	});
});
