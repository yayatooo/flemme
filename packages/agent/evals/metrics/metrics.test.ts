import { describe, expect, test } from "bun:test";
import type { EvalOutcome } from "@anvia/core/evals";
import { AYAM_KECAP_COOKING_PLAN } from "../../src/fixtures/ayam-kecap-cooking-plan";
import { activeCookingCases } from "../cases/active-cooking-cases";
import { completionCases } from "../cases/completion-cases";
import { recommendationCases } from "../cases/recommendation-cases";
import {
	activeCookingActionMetric,
	activeCookingSchemaMetric,
} from "./active-cooking-metrics";
import {
	completionGroundingMetric,
	completionSchemaMetric,
} from "./completion-metrics";
import {
	hasUniquePlanIds,
	preCookingSchemaMetric,
} from "./pre-cooking-metrics";
import {
	recommendationInventoryMetric,
	recommendationSchemaMetric,
} from "./recommendation-metrics";

const signal = new AbortController().signal;

async function evaluate(
	metric: { evaluate: (args: never) => unknown },
	testCase: unknown,
	output: unknown,
): Promise<EvalOutcome<unknown>> {
	return (await metric.evaluate({
		suiteName: "unit",
		case: testCase,
		output,
		signal,
	} as never)) as EvalOutcome<unknown>;
}

function required<T>(value: T | undefined): T {
	if (value === undefined)
		throw new Error("Expected eval fixture was not found");
	return value;
}

describe("deterministic eval metrics", () => {
	test("recommendation schema and inventory honesty pass a grounded output", async () => {
		const testCase = required(recommendationCases[0]);
		const output = {
			type: "recommendations" as const,
			recommendations: [
				{
					name: "Chicken dinner",
					description: "A practical dinner.",
					reason: "Uses listed food.",
					estimatedDuration: { minMinutes: 20, maxMinutes: 30 },
					servings: 2,
					feasibility: "ready" as const,
					ingredients: [{ name: "chicken", status: "available" as const }],
					equipment: [{ name: "wok", status: "available" as const }],
					preferenceMatches: [],
					requiredConfirmations: [],
					optionalIngredients: [],
					warnings: [],
				},
			],
		};
		expect(
			(await evaluate(recommendationSchemaMetric, testCase, output)).outcome,
		).toBe("pass");
		expect(
			(await evaluate(recommendationInventoryMetric, testCase, output)).outcome,
		).toBe("pass");
	});

	test("rejects fabricated available inventory", async () => {
		const testCase = required(recommendationCases[0]);
		const output = {
			type: "recommendations",
			recommendations: [
				{
					ingredients: [{ name: "truffle", status: "available" }],
					equipment: [],
					optionalIngredients: [],
				},
			],
		};
		expect(
			(await evaluate(recommendationInventoryMetric, testCase, output)).outcome,
		).toBe("fail");
	});

	test("pre-cooking plan schema and ID uniqueness are deterministic", async () => {
		const testCase = {
			id: "plan",
			input: null,
			expected: { requiredEquipment: [] },
		};
		expect(
			(
				await evaluate(
					preCookingSchemaMetric,
					testCase,
					AYAM_KECAP_COOKING_PLAN,
				)
			).outcome,
		).toBe("pass");
		expect(hasUniquePlanIds(AYAM_KECAP_COOKING_PLAN)).toBe(true);
	});

	test("active cooking accepts a compatible advance and rejects mutation on clarification", async () => {
		const advance = required(activeCookingCases[0]);
		const output = {
			reply: "Continue.",
			actions: [{ type: "advance" as const }],
		};
		expect(
			(await evaluate(activeCookingSchemaMetric, advance, output)).outcome,
		).toBe("pass");
		expect(
			(await evaluate(activeCookingActionMetric, advance, output)).outcome,
		).toBe("pass");
		const clarify = required(activeCookingCases.at(-1));
		expect(
			(await evaluate(activeCookingActionMetric, clarify, output)).outcome,
		).toBe("fail");
	});

	test("completion schema and supplied grounding anchors pass", async () => {
		const testCase = required(completionCases[0]);
		const output = {
			reply: "Your chicken is finished.",
			summary: { title: "Ayam Kecap", description: "Completed chicken dish." },
			notes: [],
		};
		expect(
			(await evaluate(completionSchemaMetric, testCase, output)).outcome,
		).toBe("pass");
		expect(
			(await evaluate(completionGroundingMetric, testCase, output)).outcome,
		).toBe("pass");
	});
});
