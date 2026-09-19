import type { CompletionInput } from "../../index";
import { completionInput } from "../fixtures/cooking-context";
import type { CompletionExpectation, FlemmeEvalCase } from "../types";

export const completionCases: Array<
	FlemmeEvalCase<CompletionInput, CompletionExpectation>
> = [
	{
		id: "completion-standard",
		input: completionInput("Cooking is finished."),
		expected: { requiredGroundingTerms: ["chicken", "ayam kecap"] },
		metadata: {
			category: "standard",
			intent: "close-completed-session",
			phase: "completion",
		},
	},
	{
		id: "completion-taste-feedback",
		input: completionInput("Finished; it tastes a little salty."),
		expected: { requiredGroundingTerms: ["salty", "salt"] },
		metadata: {
			category: "taste-feedback",
			intent: "close-completed-session",
			phase: "completion",
		},
	},
	{
		id: "completion-recorded-change",
		input: completionInput(undefined, [
			{
				kind: "servings",
				description: "Serving quantity changed from 2 to 3 during cooking.",
			},
		]),
		expected: { requiredGroundingTerms: ["3", "three", "serving"] },
		metadata: {
			category: "recorded-change",
			intent: "close-completed-session",
			phase: "completion",
		},
	},
];
