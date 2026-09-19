import type { CookingRecommendationInput } from "../../index";
import { BASE_RECOMMENDATION_CONTEXT } from "../fixtures/cooking-context";
import type { FlemmeEvalCase, RecommendationExpectation } from "../types";

type RecommendationCase = FlemmeEvalCase<
	CookingRecommendationInput,
	RecommendationExpectation
>;

function recommendationCase(
	id: string,
	category: string,
	input: CookingRecommendationInput,
	expected: RecommendationExpectation,
): RecommendationCase {
	return {
		id,
		input,
		expected,
		metadata: { category, intent: "recommend-meal", phase: "recommendation" },
	};
}

const recommend = ["recommendations"] as const;

export const recommendationCases: RecommendationCase[] = [
	recommendationCase(
		"recommendation-common-inventory-fit",
		"common-inventory-fit",
		BASE_RECOMMENDATION_CONTEXT,
		{ allowedVariants: [...recommend], expectedServings: 2 },
	),
	recommendationCase(
		"recommendation-unknown-pantry-staples",
		"unknown-pantry-staples",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			inventory: BASE_RECOMMENDATION_CONTEXT.inventory.filter(
				({ name }) => !["salt", "cooking oil"].includes(name),
			),
		},
		{ allowedVariants: [...recommend], expectedServings: 2 },
	),
	recommendationCase(
		"recommendation-missing-required-ingredient",
		"missing-required-ingredient",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			inventory: BASE_RECOMMENDATION_CONTEXT.inventory.filter(
				({ name }) => name !== "sweet soy sauce",
			),
			session: {
				...BASE_RECOMMENDATION_CONTEXT.session,
				request: "Make ayam kecap; I do not have sweet soy sauce.",
			},
		},
		{
			allowedVariants: ["recommendations", "no_viable_recommendation"],
			explicitlyMissingIngredients: ["sweet soy sauce"],
			expectedServings: 2,
		},
	),
	recommendationCase(
		"recommendation-equipment-constrained",
		"equipment-constrained",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			kitchen: { equipment: ["rice cooker", "knife"] },
			session: {
				...BASE_RECOMMENDATION_CONTEXT.session,
				request: "Suggest a meal I can make with only my listed equipment.",
			},
		},
		{
			allowedVariants: [...recommend],
			explicitlyUnavailableEquipment: ["wok", "gas stove", "oven"],
			expectedServings: 2,
		},
	),
	recommendationCase(
		"recommendation-household-servings",
		"household-and-serving-context",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			household: { adults: 2, children: 2, toddlers: 0 },
			session: { ...BASE_RECOMMENDATION_CONTEXT.session, servings: 4 },
		},
		{ allowedVariants: [...recommend], expectedServings: 4 },
	),
	recommendationCase(
		"recommendation-time-constrained",
		"time-constrained-session",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			session: {
				request: "Give me the quickest practical meal.",
				servings: 2,
				availableMinutes: 20,
			},
		},
		{
			allowedVariants: ["recommendations", "no_viable_recommendation"],
			expectedServings: 2,
		},
	),
	recommendationCase(
		"recommendation-insufficient-context",
		"insufficient-context",
		{
			inventory: [],
			kitchen: { equipment: [] },
			household: { adults: 0, children: 0, toddlers: 0 },
			foodPreferences: [],
			cookingPreferences: [],
			session: {},
		},
		{ allowedVariants: ["clarification", "no_viable_recommendation"] },
	),
	recommendationCase(
		"recommendation-no-viable",
		"no-viable-without-inventory-hallucination",
		{
			inventory: [],
			kitchen: { equipment: [] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: [],
			cookingPreferences: [],
			session: {
				request: "Cook a roast chicken in my oven now.",
				servings: 1,
				availableMinutes: 10,
			},
		},
		{
			allowedVariants: ["clarification", "no_viable_recommendation"],
			explicitlyMissingIngredients: ["chicken"],
			explicitlyUnavailableEquipment: ["oven"],
		},
	),
	recommendationCase(
		"recommendation-cuisine-ranking-signals",
		"cuisine-ranking-signals",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			foodPreferences: [
				"likes Indonesian cuisine",
				"likes Japanese cuisine",
				"likes Thai cuisine",
			],
		},
		{ allowedVariants: [...recommend], expectedServings: 2 },
	),
	recommendationCase(
		"recommendation-cross-cuisine-fallback",
		"cross-cuisine-fallback",
		{
			...BASE_RECOMMENDATION_CONTEXT,
			foodPreferences: ["usually likes Italian cuisine"],
			session: {
				...BASE_RECOMMENDATION_CONTEXT.session,
				request: "Prioritize using my chicken and sweet soy sauce practically.",
			},
		},
		{ allowedVariants: [...recommend], expectedServings: 2 },
	),
];

export const recommendationSmokeCases = recommendationCases.slice(0, 1);
