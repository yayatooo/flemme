import { createEvalTypes, EvalOutcome } from "@anvia/core/evals";
import type { PreCookingInput, PreCookingOutput } from "../../index";
import { PreCookingOutputSchema } from "../../index";

type Expected = { requiredEquipment: string[] };
const { defineMetric } = createEvalTypes<
	PreCookingInput,
	PreCookingOutput,
	Expected
>();

function outcome(ok: boolean, comment: string) {
	return ok
		? EvalOutcome.pass(true, { comment })
		: EvalOutcome.fail(false, { comment });
}

export function hasUniquePlanIds(output: PreCookingOutput) {
	const ids = [
		...output.preparationSteps.map(({ id }) => id),
		...output.cookingStages.flatMap((stage) => [
			stage.id,
			...stage.steps.map(({ id }) => id),
		]),
	];
	return new Set(ids).size === ids.length;
}

export const preCookingSchemaMetric = defineMetric({
	name: "pre-cooking-schema",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output }) =>
		outcome(
			PreCookingOutputSchema.safeParse(output).success,
			"Output must pass the production pre-cooking schema.",
		),
});

export const preCookingPlanMetric = defineMetric({
	name: "pre-cooking-plan-invariants",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output }) => {
		const executable =
			output.cookingStages.length > 0 &&
			output.cookingStages.every(
				(stage) =>
					stage.steps.length > 0 &&
					stage.steps.every((step) => step.instruction.trim().length > 0),
			);
		const qualitativeTiming = [
			...output.preparationSteps,
			...output.cookingStages.flatMap(({ steps }) => steps),
		].every(
			(step) =>
				!step.timing ||
				["very-short", "short", "medium", "long"].includes(step.timing.level),
		);
		return outcome(
			hasUniquePlanIds(output) && executable && qualitativeTiming,
			"Plan IDs must be globally unique and stages must contain executable steps using qualitative timing.",
		);
	},
});

export const preCookingEquipmentMetric = defineMetric({
	name: "pre-cooking-required-equipment",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		const required = new Set(
			output.equipment
				.filter(({ required }) => required)
				.map(({ name }) => name.toLowerCase()),
		);
		return outcome(
			(testCase.expected?.requiredEquipment ?? []).every((name) =>
				required.has(name.toLowerCase()),
			),
			"Case-required equipment must be explicit in the plan.",
		);
	},
});

export const preCookingMetrics = [
	preCookingSchemaMetric,
	preCookingPlanMetric,
	preCookingEquipmentMetric,
] as const;
