import { createOpenAIModel } from "./index";
import { runCookingAgent } from "./src/runtime/cooking-agent";

const BASE_PROMPT = `
Current inventory:
- eggs
- cooked rice
- garlic
- spring onions
- chili

Kitchen equipment:
- one frying pan
- gas stove

Household:
- 2 adults
- 1 child

Food preferences:
- likes spicy food
- prefers Asian-style meals

Cooking preferences:
- usually prefers meals under 30 minutes

Current request:
- cooking only for one person tonight
- has 20 minutes
`;

function getRequiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];

	if (!value) {
		throw new Error(`${name} is missing`);
	}

	return value;
}

const arguments_ = Bun.argv.slice(2);

const usage = 'Usage: bun run runner -- ["Suggest a meal with eggs and rice"]';

if (arguments_.includes("--help")) {
	console.log(usage);
	process.exit(0);
}


const model = createOpenAIModel({
	apiKey: getRequiredEnvironmentVariable("MUX_API_KEY"),
	baseUrl: getRequiredEnvironmentVariable("BASE_URL"),
});

const result = await runCookingAgent({
	model,
	context: BASE_PROMPT,
});

console.log(result.output);
