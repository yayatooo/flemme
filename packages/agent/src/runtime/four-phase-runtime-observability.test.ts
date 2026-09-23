import { describe, expect, test } from "bun:test";
import { type CompletionModel, Usage } from "@anvia/core";

import {
	activeCookingInput,
	BASE_PRE_COOKING_INPUT,
	completionInput,
} from "../../evals/fixtures/cooking-context";
import { AYAM_KECAP_COOKING_PLAN } from "../fixtures/ayam-kecap-cooking-plan";
import { runActiveCooking } from "../intents/active-cooking";
import { runCompletion } from "../intents/completion";
import { runPreCooking } from "../intents/pre-cooking";
import type {
	RuntimeTrace,
	RuntimeTraceObserver,
} from "../observability/recommendation-observability";

const completionOutput = {
	reply: "Synthetic completion reply.",
	summary: {
		title: "Synthetic completion",
		description: "Synthetic completion summary.",
	},
	notes: [],
};
const activeOutput = {
	reply: "Synthetic active guidance.",
	actions: [],
};

function model(output: unknown, failure?: Error): CompletionModel<null> {
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
			if (failure) throw failure;
			return {
				choice: [{ type: "text", text: JSON.stringify(output) }],
				usage: {
					...Usage.empty(),
					inputTokens: 4,
					outputTokens: 3,
					totalTokens: 7,
				},
				finishReason: "stop",
				rawResponse: null,
			};
		},
	};
}

function observer(
	traces: RuntimeTrace[],
	overrides: Partial<RuntimeTraceObserver> = {},
): RuntimeTraceObserver {
	return {
		serviceName: "flemme-agent",
		environment: "test",
		shouldSample: () => true,
		record: (trace) => traces.push(trace),
		flush: async () => undefined,
		...overrides,
	};
}

describe("four-phase runtime equivalence", () => {
	test("Pre-Cooking preserves output and emits one metadata-only trace", async () => {
		const traces: RuntimeTrace[] = [];
		const disabled = await runPreCooking({
			model: model(AYAM_KECAP_COOKING_PLAN),
			input: BASE_PRE_COOKING_INPUT,
		});
		const enabled = await runPreCooking({
			model: model(AYAM_KECAP_COOKING_PLAN),
			input: BASE_PRE_COOKING_INPUT,
			observability: observer(traces),
		});
		expect(enabled).toEqual(disabled);
		expect(traces).toHaveLength(1);
		expect(traces[0]).toMatchObject({
			phase: "pre-cooking",
			status: "success",
			executionPath: "model",
			resultVariant: "cooking_plan",
		});
		expect(JSON.stringify(traces)).not.toMatch(
			/ingredient|equipment|preparation|stage/i,
		);
	});

	test("Pre-Cooking preserves exact selected-recipe equipment names", async () => {
		const output = await runPreCooking({
			model: model({
				...AYAM_KECAP_COOKING_PLAN,
				equipment: [{ name: "wok (required)", required: false }],
			}),
			input: BASE_PRE_COOKING_INPUT,
		});

		expect(output.equipment).toEqual(
			BASE_PRE_COOKING_INPUT.selectedRecipe.equipment.map(({ name }) => ({
				name,
				required: true,
			})),
		);
	});

	test("Completion preserves output and emits one metadata-only trace", async () => {
		const traces: RuntimeTrace[] = [];
		const disabled = await runCompletion({
			model: model(completionOutput),
			input: completionInput("Private completion feedback."),
		});
		const enabled = await runCompletion({
			model: model(completionOutput),
			input: completionInput("Private completion feedback."),
			observability: observer(traces),
		});
		expect(enabled).toEqual(disabled);
		expect(traces).toHaveLength(1);
		expect(traces[0]).toMatchObject({
			phase: "completion",
			status: "success",
			executionPath: "model",
			resultVariant: "completion",
		});
		expect(JSON.stringify(traces)).not.toContain("Private completion");
	});

	test("Active Cooking preserves model and local outputs without mutation", async () => {
		const traces: RuntimeTrace[] = [];
		const modelInput = activeCookingInput("Give safe guidance for this step.");
		const localInput = activeCookingInput("What is the weather tomorrow?");
		const modelBefore = structuredClone(modelInput);
		const localBefore = structuredClone(localInput);

		const modelResult = await runActiveCooking({
			model: model(activeOutput),
			input: modelInput,
			observability: observer(traces),
		});
		const localResult = await runActiveCooking({
			model: model(null, new Error("local path invoked model")),
			input: localInput,
			observability: observer(traces),
		});

		expect(modelResult).toEqual(activeOutput);
		expect(localResult.actions).toEqual([]);
		expect(modelInput).toEqual(modelBefore);
		expect(localInput).toEqual(localBefore);
		expect(traces).toHaveLength(2);
		expect(traces.map(({ executionPath }) => executionPath)).toEqual([
			"model",
			"local",
		]);
		expect(JSON.stringify(traces)).not.toMatch(/weather|guidance|action/i);
	});

	test("relay record failure remains fail-open for every new phase", async () => {
		const failingObserver = observer([], {
			record: () => {
				throw new Error("relay unavailable");
			},
		});
		expect(
			await runPreCooking({
				model: model(AYAM_KECAP_COOKING_PLAN),
				input: BASE_PRE_COOKING_INPUT,
				observability: failingObserver,
			}),
		).toEqual(AYAM_KECAP_COOKING_PLAN);
		expect(
			await runActiveCooking({
				model: model(activeOutput),
				input: activeCookingInput("Give safe guidance for this step."),
				observability: failingObserver,
			}),
		).toEqual(activeOutput);
		expect(
			await runCompletion({
				model: model(completionOutput),
				input: completionInput(),
				observability: failingObserver,
			}),
		).toEqual(completionOutput);
	});

	test("original thrown errors remain identical and sanitized", async () => {
		for (const phase of [
			"pre-cooking",
			"active-cooking",
			"completion",
		] as const) {
			const traces: RuntimeTrace[] = [];
			const original = new Error(`private ${phase} provider failure`);
			const options = {
				"pre-cooking": () =>
					runPreCooking({
						model: model(null, original),
						input: BASE_PRE_COOKING_INPUT,
						observability: observer(traces),
					}),
				"active-cooking": () =>
					runActiveCooking({
						model: model(null, original),
						input: activeCookingInput("Give safe guidance for this step."),
						observability: observer(traces),
					}),
				completion: () =>
					runCompletion({
						model: model(null, original),
						input: completionInput(),
						observability: observer(traces),
					}),
			};
			await expect(options[phase]()).rejects.toBe(original);
			expect(traces).toHaveLength(1);
			expect(traces[0]?.status).toBe("failure");
			expect(JSON.stringify(traces)).not.toContain("private");
		}
	});
});
