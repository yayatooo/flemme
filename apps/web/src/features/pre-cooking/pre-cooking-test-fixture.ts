import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";

export const preCookingFixture = {
	preparationSummary: {
		overview:
			"Measure everything first, then cook the chicken in two calm stages.",
		preparationTimeMinutes: 12,
		cookingTimeMinutes: 24,
	},
	ingredients: [
		{ name: "Chicken thigh", quantity: 300, unit: "g" },
		{ name: "Garlic", quantity: 3, unit: "cloves" },
		{ name: "Salt" },
	],
	equipment: [
		{ name: "Frying pan", required: true },
		{ name: "Spatula", required: false },
	],
	preparationSteps: [
		{
			id: "slice-garlic",
			instruction: "Thinly slice the garlic.",
			timing: { level: "very-short", cue: "Keep the slices even" },
		},
		{
			id: "marinate-chicken",
			instruction: "Coat the chicken with sweet soy sauce.",
			timing: { level: "medium", cue: "Until evenly coated" },
		},
	],
	cookingStages: [
		{
			id: "build-sauce",
			title: "Build the sauce",
			steps: [
				{
					id: "toast-garlic",
					instruction: "Cook the garlic gently.",
					timing: { level: "short", cue: "Until fragrant" },
				},
			],
		},
		{
			id: "cook-chicken",
			title: "Cook the chicken",
			steps: [
				{
					id: "brown-chicken",
					instruction: "Brown the chicken on both sides.",
					timing: { level: "long", cue: "Until cooked through" },
				},
				{
					id: "coat-chicken",
					instruction: "Coat the chicken in the sauce.",
				},
			],
		},
	],
} as const satisfies PreCookingOutput;
