import type { ActiveCookingInput } from "../../index";
import { activeCookingInput } from "../fixtures/cooking-context";
import type { ActiveCookingExpectation, FlemmeEvalCase } from "../types";

type ActiveCase = FlemmeEvalCase<ActiveCookingInput, ActiveCookingExpectation>;

function activeCase(
	id: string,
	category: string,
	input: ActiveCookingInput,
	expected: ActiveCookingExpectation,
): ActiveCase {
	return {
		id,
		input,
		expected,
		metadata: { category, intent: "continue-cooking", phase: "active-cooking" },
	};
}

export const activeCookingCases: ActiveCase[] = [
	activeCase(
		"active-advance",
		"advance",
		activeCookingInput("This step is done, go to the next step."),
		{
			allowedActionTypes: ["advance", "record-change"],
			requiredActionType: "advance",
		},
	),
	activeCase(
		"active-previous",
		"previous-step",
		activeCookingInput("Go back to the previous step.", {
			currentStageId: "stage-cook-chicken",
			currentStepId: "add-chicken",
			completedStepIds: [
				"prep-cut-chicken",
				"prep-slice-aromatics",
				"prep-measure-sauce",
				"heat-oil",
				"saute-aromatics",
			],
		}),
		{
			allowedActionTypes: ["previous-step"],
			requiredActionType: "previous-step",
		},
	),
	activeCase(
		"active-pause",
		"pause",
		activeCookingInput("Pause cooking for an interruption."),
		{ allowedActionTypes: ["pause"], requiredActionType: "pause" },
	),
	activeCase(
		"active-resume",
		"resume",
		activeCookingInput("I have the ingredient now; resume cooking.", {
			status: "paused",
			pauseReason: "missing-ingredient",
			currentStageId: "stage-finish-sauce",
			currentStepId: "add-sauce",
			completedStepIds: [
				"prep-cut-chicken",
				"prep-slice-aromatics",
				"prep-measure-sauce",
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
				"brown-chicken",
			],
			changes: [
				{
					kind: "ingredient",
					description: "Sweet soy sauce was unavailable.",
					relatedStepId: "add-sauce",
				},
			],
		}),
		{
			allowedActionTypes: ["resume", "record-change"],
			requiredActionType: "resume",
		},
	),
	activeCase(
		"active-record-change",
		"record-change",
		activeCookingInput(
			"I used a frying pan instead of the wok; record that change.",
		),
		{
			allowedActionTypes: ["record-change"],
			requiredActionType: "record-change",
		},
	),
	activeCase(
		"active-complete",
		"completion",
		activeCookingInput("The final step is done; finish cooking.", {
			currentStageId: "stage-finish-sauce",
			currentStepId: "finish-and-taste",
			completedStepIds: [
				"prep-cut-chicken",
				"prep-slice-aromatics",
				"prep-measure-sauce",
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
				"brown-chicken",
				"add-sauce",
				"simmer-chicken",
			],
		}),
		{
			allowedActionTypes: ["complete-cooking"],
			requiredActionType: "complete-cooking",
		},
	),
	activeCase(
		"active-abandon",
		"abandonment",
		activeCookingInput("Cancel cooking and abandon this session."),
		{
			allowedActionTypes: ["abandon-cooking"],
			requiredActionType: "abandon-cooking",
		},
	),
	activeCase(
		"active-clarification",
		"clarification",
		activeCookingInput("Is this okay?"),
		{ allowedActionTypes: [] },
	),
];
