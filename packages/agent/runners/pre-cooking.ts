import {
	createOpenAIModel,
	type PreCookingInput,
	PreCookingInputSchema,
} from "../index";
import { runPreCooking } from "../src/intents/pre-cooking";

const BASE_PRE_COOKING_INPUT: PreCookingInput = {
	selectedRecipe: {
		name: "Ayam Kecap",
		description:
			"Chicken cooked in one pan with garlic, shallot, and sweet soy sauce, then simmered until savory and glossy.",
		reason:
			"It uses the available chicken, aromatics, and sweet soy sauce and fits the household's preference for practical Indonesian home cooking.",
		estimatedDuration: {
			minMinutes: 35,
			maxMinutes: 45,
		},
		servings: 2,
		feasibility: "ready",
		ingredients: [
			{ name: "chicken", status: "available", requiredAmount: "500 grams" },
			{ name: "garlic", status: "available", requiredAmount: "3 cloves" },
			{ name: "shallot", status: "available", requiredAmount: "4 pieces" },
			{
				name: "sweet soy sauce",
				status: "available",
				requiredAmount: "4 tablespoons",
			},
			{
				name: "cooking oil",
				status: "available",
				requiredAmount: "2 tablespoons",
			},
			{ name: "water", status: "available", requiredAmount: "150 milliliters" },
			{ name: "salt", status: "available", requiredAmount: "1/2 teaspoon" },
		],
		equipment: [
			{ name: "wok", status: "available" },
			{ name: "gas stove", status: "available" },
			{ name: "knife", status: "available" },
			{ name: "cutting board", status: "available" },
			{ name: "spatula", status: "available" },
		],
		preferenceMatches: ["Indonesian home cooking", "Practical one-pan meal"],
		requiredConfirmations: [],
		optionalIngredients: [],
		warnings: [],
	},
	context: {
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
		household: {
			adults: 2,
			children: 0,
			toddlers: 0,
		},
		foodPreferences: ["likes Indonesian home cooking"],
		cookingPreferences: ["prefers practical one-pan meals"],
		session: {
			request: "Prepare the selected Ayam Kecap for dinner.",
			servings: 2,
			availableMinutes: 45,
		},
	},
};

function getRequiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];

	if (!value) {
		throw new Error(`${name} is missing`);
	}

	return value;
}

try {
	const model = createOpenAIModel({
		apiKey: getRequiredEnvironmentVariable("MUX_API_KEY"),
		baseUrl: getRequiredEnvironmentVariable("BASE_URL"),
		modelId: "gpt-5.6-luna",
	});
	const input = PreCookingInputSchema.parse(BASE_PRE_COOKING_INPUT);
	const result = await runPreCooking({ model, input });

	console.dir(result, { depth: null });
} catch (error) {
	console.error(error);
	process.exit(1);
}
