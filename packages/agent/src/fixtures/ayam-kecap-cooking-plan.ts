import type { CompletedActiveCookingSession } from "../schemas/active-cooking-input";
import type { PreCookingOutput } from "../schemas/pre-cooking-output";

export const AYAM_KECAP_COOKING_PLAN: PreCookingOutput = {
	preparationSummary: {
		overview:
			"Ayam kecap for two, prepared first and then cooked through three stages in one wok.",
		preparationTimeMinutes: 15,
		cookingTimeMinutes: 30,
	},
	ingredients: [
		{ name: "chicken", quantity: 500, unit: "g" },
		{ name: "garlic", quantity: 3, unit: "cloves" },
		{ name: "shallot", quantity: 4, unit: "pieces" },
		{ name: "sweet soy sauce", quantity: 4, unit: "tablespoons" },
		{ name: "cooking oil", quantity: 2, unit: "tablespoons" },
		{ name: "water", quantity: 150, unit: "ml" },
		{ name: "salt", quantity: 0.5, unit: "teaspoon" },
	],
	equipment: [
		{ name: "wok", required: true },
		{ name: "gas stove", required: true },
		{ name: "knife", required: true },
		{ name: "cutting board", required: true },
		{ name: "spatula", required: true },
	],
	preparationSteps: [
		{
			id: "prep-cut-chicken",
			instruction: "Cut the chicken into even bite-sized pieces.",
		},
		{
			id: "prep-slice-aromatics",
			instruction: "Thinly slice the shallots and finely chop the garlic.",
		},
		{
			id: "prep-measure-sauce",
			instruction: "Measure the sweet soy sauce, water, and salt.",
		},
	],
	cookingStages: [
		{
			id: "stage-cook-aromatics",
			title: "Cook the aromatics",
			steps: [
				{
					id: "heat-oil",
					instruction: "Heat the cooking oil in the wok over medium heat.",
					timing: {
						level: "very-short",
						cue: "The oil surface begins to shimmer.",
					},
				},
				{
					id: "saute-aromatics",
					instruction: "Add the shallots and garlic, then saute gently.",
					timing: {
						level: "short",
						cue: "The aromatics smell fragrant and the shallots look translucent.",
					},
				},
			],
		},
		{
			id: "stage-cook-chicken",
			title: "Cook the chicken",
			steps: [
				{
					id: "add-chicken",
					instruction: "Add the chicken pieces to the aromatic mixture.",
				},
				{
					id: "brown-chicken",
					instruction:
						"Turn the chicken pieces until their surfaces are opaque.",
					timing: {
						level: "short",
						cue: "No raw pink remains on the outside of the chicken.",
					},
				},
			],
		},
		{
			id: "stage-finish-sauce",
			title: "Finish the sauce",
			steps: [
				{
					id: "add-sauce",
					instruction: "Add the sweet soy sauce, water, and measured salt.",
				},
				{
					id: "simmer-chicken",
					instruction: "Simmer gently, turning the chicken occasionally.",
					timing: {
						level: "medium",
						cue: "The chicken is cooked through and the sauce looks glossy and reduced.",
					},
				},
				{
					id: "finish-and-taste",
					instruction:
						"Turn off the heat, taste the sauce, and confirm the chicken is cooked through.",
				},
			],
		},
	],
};

export const AYAM_KECAP_COMPLETED_SESSION: CompletedActiveCookingSession = {
	status: "completed",
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
		"finish-and-taste",
	],
	changes: [],
};
