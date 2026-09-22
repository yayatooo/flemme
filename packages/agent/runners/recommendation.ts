import {
	type CookingRecommendationInput,
	CookingRecommendationInputSchema,
	createOpenRouterModel,
	runCookingAgent,
} from "../index";

const BASE_CONTEXT: CookingRecommendationInput = {
	inventory: [
		{ name: "skipjack tuna" },
		{ name: "banana leaf" },
		{ name: "shallot" },
		{ name: "garlic" },
		{ name: "spring onions" },
		{ name: "chili" },
		{ name: "tomato" },
		{ name: "lime" },
		{ name: "palm oil" },
		{ name: "salt" },
		{ name: "MSG" },
		{ name: "turmeric" },
	],

	kitchen: {
		equipment: ["frying pan", "gas stove", "fish grill", "charcoal"],
	},

	household: {
		adults: 2,
		children: 0,
		toddlers: 0,
	},

	foodPreferences: [
		"likes spicy food",
		"likes North Sulawesi cuisine",
		"likes Japanese cuisine",
		"likes Thai cuisine",
	],

	cookingPreferences: ["usually prefers meals under 60 minutes"],

	session: {
		request: "I want a savory dinner using the fish I already have.",
		servings: 2,
		availableMinutes: 60,
	},
};

function getRequiredOpenRouterApiKey() {
	const value = Bun.env.OPENROUTER_API_KEY ?? Bun.env.OPEN_API_KEY;

	if (!value) {
		throw new Error("OPENROUTER_API_KEY is missing");
	}

	return value;
}
const model = createOpenRouterModel({
	apiKey: getRequiredOpenRouterApiKey(),
	modelId: Bun.env.OPENROUTER_MODEL,
});

const context = CookingRecommendationInputSchema.parse(BASE_CONTEXT);

const result = await runCookingAgent({
	model,
	context,
});

console.dir(result, { depth: null });
