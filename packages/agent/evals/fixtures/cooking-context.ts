import type {
	ActiveCookingInput,
	CompletionInput,
	CookingRecommendation,
	CookingRecommendationInput,
	PreCookingInput,
} from "../../index";
import {
	AYAM_KECAP_COMPLETED_SESSION,
	AYAM_KECAP_COOKING_PLAN,
} from "../../src/fixtures/ayam-kecap-cooking-plan";

export const BASE_RECOMMENDATION_CONTEXT: CookingRecommendationInput = {
	inventory: [
		{ name: "chicken", quantity: "500 grams", condition: "fresh" },
		{ name: "garlic", quantity: "3 cloves", condition: "fresh" },
		{ name: "shallot", quantity: "4 pieces", condition: "fresh" },
		{ name: "sweet soy sauce", quantity: "4 tablespoons" },
		{ name: "cooking oil", quantity: "2 tablespoons" },
		{ name: "water", quantity: "150 milliliters" },
		{ name: "salt", quantity: "1/2 teaspoon" },
	],
	kitchen: {
		equipment: ["wok", "gas stove", "knife", "cutting board", "spatula"],
	},
	household: { adults: 2, children: 0, toddlers: 0 },
	foodPreferences: ["likes Indonesian home cooking"],
	cookingPreferences: ["prefers practical one-pan meals"],
	session: {
		request: "I want a savory chicken dinner using what I already have.",
		servings: 2,
		availableMinutes: 45,
	},
};

export const AYAM_KECAP_RECOMMENDATION: CookingRecommendation = {
	name: "Ayam Kecap",
	description: "Chicken simmered with aromatics and sweet soy sauce.",
	reason: "It uses the supplied ingredients and available one-pan equipment.",
	estimatedDuration: { minMinutes: 35, maxMinutes: 45 },
	servings: 2,
	feasibility: "ready",
	ingredients: BASE_RECOMMENDATION_CONTEXT.inventory.map((item) => ({
		name: item.name,
		status: "available" as const,
		requiredAmount: item.quantity,
	})),
	equipment: BASE_RECOMMENDATION_CONTEXT.kitchen.equipment.map((name) => ({
		name,
		status: "available" as const,
	})),
	preferenceMatches: ["Indonesian home cooking", "Practical one-pan meal"],
	requiredConfirmations: [],
	optionalIngredients: [],
	warnings: [],
};

export const BASE_PRE_COOKING_INPUT: PreCookingInput = {
	selectedRecipe: AYAM_KECAP_RECOMMENDATION,
	context: BASE_RECOMMENDATION_CONTEXT,
};

const PREPARATION_STEP_IDS = [
	"prep-cut-chicken",
	"prep-slice-aromatics",
	"prep-measure-sauce",
];

export function activeCookingInput(
	message: string,
	overrides: Partial<ActiveCookingInput["session"]> = {},
): ActiveCookingInput {
	return {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-aromatics",
			currentStepId: "heat-oil",
			completedStepIds: PREPARATION_STEP_IDS,
			changes: [],
			...overrides,
		} as ActiveCookingInput["session"],
		message,
	};
}

export function completionInput(
	message?: string,
	changes: CompletionInput["session"]["changes"] = [],
): CompletionInput {
	return {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: { ...AYAM_KECAP_COMPLETED_SESSION, changes },
		...(message ? { message } : {}),
	};
}
