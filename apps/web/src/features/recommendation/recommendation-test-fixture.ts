import type { CookingRecommendation } from "@flemme/agent/cooking-recommendation-output";

export const recommendationFixture = {
	name: "Ayam Kecap Sayur",
	description: "Savory chicken and vegetables in a sweet soy glaze.",
	reason:
		"Uses the chicken and vegetables already available and fits a quick family dinner.",
	estimatedDuration: { minMinutes: 25, maxMinutes: 35 },
	servings: 3,
	feasibility: "needs_confirmation",
	ingredients: [
		{ name: "Chicken", status: "available", requiredAmount: "500 g" },
		{
			name: "Sweet soy sauce",
			status: "unconfirmed",
			requiredAmount: "3 tbsp",
			note: "Confirm the bottle has enough left.",
		},
		{ name: "Spring onion", status: "missing", requiredAmount: "1 stalk" },
	],
	equipment: [
		{ name: "Wok", status: "available" },
		{ name: "Stove", status: "available" },
	],
	preferenceMatches: ["Quick", "Family-friendly"],
	requiredConfirmations: ["Check the remaining sweet soy sauce."],
	optionalIngredients: [
		{ name: "Fried shallots", note: "Use as a crunchy topping." },
	],
	warnings: ["Cook chicken through before serving."],
} as const satisfies CookingRecommendation;

export const recommendationFixtures = [
	recommendationFixture,
	{
		...recommendationFixture,
		name: "Chicken Vegetable Fried Rice",
		reason: "Makes a fast one-pan meal from rice, chicken, and vegetables.",
		feasibility: "ready",
		requiredConfirmations: [],
		warnings: [],
	},
	{
		...recommendationFixture,
		name: "Warm Chicken Salad",
		reason: "Uses the available protein and vegetables for a lighter meal.",
		feasibility: "blocked",
		preferenceMatches: [],
	},
] as const satisfies ReadonlyArray<CookingRecommendation>;
