import { createEvalTypes, EvalOutcome } from "@anvia/core/evals";
import type { ActiveCookingInput, ActiveCookingOutput } from "../../index";
import { ActiveCookingOutputSchema } from "../../index";
import type { ActiveCookingExpectation } from "../types";

const { defineMetric } = createEvalTypes<
	ActiveCookingInput,
	ActiveCookingOutput,
	ActiveCookingExpectation
>();

function outcome(ok: boolean, comment: string) {
	return ok
		? EvalOutcome.pass(true, { comment })
		: EvalOutcome.fail(false, { comment });
}

export const activeCookingSchemaMetric = defineMetric({
	name: "active-cooking-schema",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output }) =>
		outcome(
			ActiveCookingOutputSchema.safeParse(output).success,
			"Output must pass the production active-cooking schema and action cardinality refinements.",
		),
});

export const activeCookingActionMetric = defineMetric({
	name: "active-cooking-action-intent",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		const expected = testCase.expected;
		const allowed = new Set(expected?.allowedActionTypes ?? []);
		const allAllowed = output.actions.every(({ type }) => allowed.has(type));
		const requiredPresent =
			!expected?.requiredActionType ||
			output.actions.some(({ type }) => type === expected.requiredActionType);
		const requiredChangePresent =
			!expected?.requiredChangeKind ||
			output.actions.some(
				(action) =>
					action.type === "record-change" &&
					action.change.kind === expected.requiredChangeKind,
			);
		return outcome(
			allAllowed && requiredPresent && requiredChangePresent,
			"Proposed actions and recorded change kinds must match the case's explicit user intent.",
		);
	},
});

export const activeCookingStateMetric = defineMetric({
	name: "active-cooking-state-safety",
	required: true,
	dataType: "BOOLEAN",
	evaluate: ({ output, case: testCase }) => {
		const clarifySafe =
			!output.actions.some(({ type }) => type === "clarify") ||
			output.actions.length === 1;
		const recordChangesValid = output.actions.every(
			(action) =>
				action.type !== "record-change" ||
				!action.change.relatedStepId ||
				testCase.input.cookingPlan.preparationSteps.some(
					({ id }) => id === action.change.relatedStepId,
				) ||
				testCase.input.cookingPlan.cookingStages.some(({ steps }) =>
					steps.some(({ id }) => id === action.change.relatedStepId),
				),
		);
		return outcome(
			clarifySafe && recordChangesValid,
			"Clarification cannot mutate state and related change IDs must resolve to the immutable supplied plan.",
		);
	},
});

export const activeCookingMetrics = [
	activeCookingSchemaMetric,
	activeCookingActionMetric,
	activeCookingStateMetric,
] as const;
