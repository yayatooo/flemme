import type { EvalCase } from "@anvia/core/evals";

export type EvalPhase =
	| "recommendation"
	| "pre-cooking"
	| "active-cooking"
	| "completion";

export type FlemmeEvalCase<Input, Expected> = EvalCase<Input, Expected> & {
	metadata: {
		category: string;
		intent: string;
		phase: EvalPhase;
	};
};

export interface RecommendationExpectation {
	allowedVariants: Array<
		"recommendations" | "clarification" | "no_viable_recommendation"
	>;
	explicitlyMissingIngredients?: string[];
	explicitlyUnavailableEquipment?: string[];
	expectedServings?: number;
}

export interface ActiveCookingExpectation {
	allowedActionTypes: string[];
	requiredActionType?: string;
	requiredChangeKind?: "ingredient" | "equipment" | "servings" | "step";
}

export interface CompletionExpectation {
	requiredGroundingTerms: string[];
}
