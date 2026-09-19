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
	preCookingPlanMetric,
	preCookingRecipeFidelityMetric,
	preCookingSchemaMetric,
} from "./pre-cooking-metrics";
import {
	recommendationInventoryMetric,
	recommendationSchemaMetric,
	recommendationTimeMetric,
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

	test("rejects a recommendation that exceeds the explicit available time", async () => {
		const testCase = required(
			recommendationCases.find(
				({ id }) => id === "recommendation-time-constrained",
			),
		);
		const output = {
			type: "recommendations",
			recommendations: [
				{ estimatedDuration: { minMinutes: 20, maxMinutes: 30 } },
			],
		};

		expect(
			(await evaluate(recommendationTimeMetric, testCase, output)).outcome,
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

	test("rejects silent recipe ingredient replacement and exact step minutes", async () => {
		const testCase = {
			id: "plan-fidelity",
			input: {
				selectedRecipe: {
					ingredients: [{ name: "chicken" }, { name: "garlic" }],
				},
			},
			expected: { requiredEquipment: [] },
		};
		const replacedPlan = {
			...AYAM_KECAP_COOKING_PLAN,
			ingredients: [{ name: "tofu" }, { name: "garlic" }],
		};
		const precisePlan = {
			...AYAM_KECAP_COOKING_PLAN,
			preparationSteps: [
				{
					...AYAM_KECAP_COOKING_PLAN.preparationSteps[0],
					instruction: "Cut the chicken, then wait exactly 5 minutes.",
				},
				...AYAM_KECAP_COOKING_PLAN.preparationSteps.slice(1),
			],
		};

		expect(
			(await evaluate(preCookingRecipeFidelityMetric, testCase, replacedPlan))
				.outcome,
		).toBe("fail");
		expect(
			(await evaluate(preCookingPlanMetric, testCase, precisePlan)).outcome,
		).toBe("fail");
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

	test("requires the case-specific recorded change kind", async () => {
		const servingCase = required(
			activeCookingCases.find(
				({ id }) => id === "active-record-serving-change",
			),
		);
		const wrongKind = {
			reply: "Recorded.",
			actions: [
				{
					type: "record-change" as const,
					change: { kind: "equipment" as const, description: "Wrong kind." },
				},
			],
		};

		expect(
			(await evaluate(activeCookingActionMetric, servingCase, wrongKind))
				.outcome,
		).toBe("fail");
	});

	test("requires resume without requiring an additional recorded change", async () => {
		const resumeCase = required(
			activeCookingCases.find(({ id }) => id === "active-resume"),
		);
		const standaloneResume = {
			reply: "Continue from the paused step.",
			actions: [{ type: "resume" as const }],
		};
		const noAction = {
			reply: "Continue from the paused step.",
			actions: [],
		};
		const unrelatedLifecycleAction = {
			reply: "Pause cooking.",
			actions: [{ type: "pause" as const, reason: "user-request" as const }],
		};

		expect(
			(await evaluate(activeCookingActionMetric, resumeCase, standaloneResume))
				.outcome,
		).toBe("pass");
		expect(
			(await evaluate(activeCookingActionMetric, resumeCase, noAction)).outcome,
		).toBe("fail");
		expect(
			(
				await evaluate(
					activeCookingActionMetric,
					resumeCase,
					unrelatedLifecycleAction,
				)
			).outcome,
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
