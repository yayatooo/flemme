import { describe, expect, test } from "bun:test";
import type { CompletionModel } from "@anvia/core";

import type { runActiveCooking } from "../intents/active-cooking";
import type { runCompletion } from "../intents/completion";
import type { runPreCooking } from "../intents/pre-cooking";
import type {
	RecommendationTrace,
	RecommendationTraceObserver,
} from "../observability/recommendation-observability";
import {
	createRecommendationTraceObserver,
	readRecommendationObservabilityConfig,
} from "../observability/recommendation-relay";
import { runCookingAgent } from "./cooking-agent";

const EXPECTED_OUTPUT = {
	type: "clarification" as const,
	question: "Synthetic question?",
	reason: "Synthetic reason.",
};

const CONTEXT = {
	inventory: [{ name: "private ingredient" }],
	kitchen: { equipment: ["private equipment"] },
	household: { adults: 1, children: 0, toddlers: 0 },
	foodPreferences: ["private preference"],
	cookingPreferences: ["private cooking preference"],
	session: {
		request: "private user request",
		servings: 1,
		availableMinutes: 10,
	},
};

function successfulModel(): CompletionModel<null> {
	return {
		provider: "synthetic",
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
				choice: [{ type: "text", text: JSON.stringify(EXPECTED_OUTPUT) }],
				usage: {
					inputTokens: 13,
					outputTokens: 5,
					totalTokens: 18,
					cachedInputTokens: 0,
					cacheCreationInputTokens: 0,
				},
				finishReason: "stop",
				rawResponse: null,
			};
		},
	};
}

function collectingObserver(
	traces: RecommendationTrace[],
): RecommendationTraceObserver {
	return {
		serviceName: "flemme-agent",
		environment: "test",
		shouldSample: () => true,
		record: (trace) => traces.push(trace),
		flush: async () => undefined,
	};
}

describe("Recommendation runtime observability", () => {
	test("preserves the exact result with observability enabled or disabled", async () => {
		const traces: RecommendationTrace[] = [];
		const disabledResult = await runCookingAgent({
			model: successfulModel(),
			context: CONTEXT,
		});
		const enabledResult = await runCookingAgent({
			model: successfulModel(),
			context: CONTEXT,
			observability: collectingObserver(traces),
		});

		expect(enabledResult).toEqual(disabledResult);
		expect(enabledResult).toEqual(EXPECTED_OUTPUT);
		expect(traces).toHaveLength(1);
		expect(traces[0]).toMatchObject({
			status: "success",
			resultVariant: "clarification",
			inputTokens: 13,
			outputTokens: 5,
		});
		expect(JSON.stringify(traces[0])).not.toContain("private");
	});

	test("preserves the original model error when trace recording fails", async () => {
		const originalError = new Error("private provider failure");
		const model = successfulModel();
		model.completion = async () => {
			throw originalError;
		};
		const observer: RecommendationTraceObserver = {
			...collectingObserver([]),
			record: () => {
				throw new Error("relay failure");
			},
		};

		await expect(
			runCookingAgent({ model, context: CONTEXT, observability: observer }),
		).rejects.toBe(originalError);
	});

	test("records only the sanitized error code and preserves the original error", async () => {
		const traces: RecommendationTrace[] = [];
		const originalError = new Error("private provider request payload");
		const model = successfulModel();
		model.completion = async () => {
			throw originalError;
		};

		await expect(
			runCookingAgent({
				model,
				context: CONTEXT,
				observability: collectingObserver(traces),
			}),
		).rejects.toBe(originalError);
		expect(traces).toHaveLength(1);
		expect(traces[0]).toMatchObject({
			status: "failure",
			errorCode: "recommendation_runtime_failed",
		});
		expect(JSON.stringify(traces[0])).not.toContain("private provider");
	});

	test("sampling exclusion emits no trace", async () => {
		const traces: RecommendationTrace[] = [];
		const observer: RecommendationTraceObserver = {
			...collectingObserver(traces),
			shouldSample: () => false,
		};

		await runCookingAgent({
			model: successfulModel(),
			context: CONTEXT,
			observability: observer,
		});
		expect(traces).toEqual([]);
	});

	test("an unavailable relay and failed flush cannot fail Recommendation", async () => {
		const observer = createRecommendationTraceObserver(
			readRecommendationObservabilityConfig({
				FLEMME_OBSERVABILITY_ENABLED: "true",
				FLEMME_OBSERVABILITY_SAMPLE_RATE: "1",
				FLEMME_OBSERVABILITY_RELAY_URL:
					"http://127.0.0.1:18081/v1/recommendation-traces",
			}),
			{
				fetch: async () => {
					throw new Error("unavailable");
				},
				diagnostic: () => undefined,
			},
		);

		const result = await runCookingAgent({
			model: successfulModel(),
			context: CONTEXT,
			observability: observer,
		});

		expect(result).toEqual(EXPECTED_OUTPUT);
		await expect(observer.flush()).rejects.toThrow("relay_unavailable");
	});

	test("does not add an observability option to the other phase boundaries", () => {
		type HasObservability<T extends (...args: never[]) => unknown> =
			"observability" extends keyof Parameters<T>[0] ? true : false;
		const phaseInstrumentation: [
			HasObservability<typeof runPreCooking>,
			HasObservability<typeof runActiveCooking>,
			HasObservability<typeof runCompletion>,
		] = [false, false, false];

		expect(phaseInstrumentation).toEqual([false, false, false]);
	});
});
