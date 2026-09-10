import {
	type CookingRecommendationInput,
	CookingRecommendationInputSchema,
	createOpenAIModel,
	runCookingAgent,
} from "./index";

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
		equipment: [
			"frying pan",
			"gas stove",
			"fish grill",
			"charcoal",
		],
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

	cookingPreferences: [
		"usually prefers meals under 60 minutes",
	],

	session: {
		request: "I want a savory dinner using the fish I already have.",
		servings: 2,
		availableMinutes: 60,
	},
};

function getRequiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];

	if (!value) {
		throw new Error(`${name} is missing`);
	}

	return value;
}
const model = createOpenAIModel({
	apiKey: getRequiredEnvironmentVariable("MUX_API_KEY"),
	baseUrl: getRequiredEnvironmentVariable("BASE_URL"),
	modelId: "gpt-5.6-luna",
});

const context = CookingRecommendationInputSchema.parse(BASE_CONTEXT);

const result = await runCookingAgent({
	model,
	context,
});

console.dir(result, { depth: null });
