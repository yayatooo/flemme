import { createOpenAIModel } from "./index";
import { runCookingAgent } from "./src/runtime/cooking-agent";

const BASE_PROMPT = `I have eggs, cooked rice, garlic, and spring onions.
I have one frying pan and 20 minutes to cook for one person.`;

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

const input = arguments_.join(" ").trim() || BASE_PROMPT;

const model = createOpenAIModel({
	apiKey: getRequiredEnvironmentVariable("MUX_API_KEY"),
	baseUrl: getRequiredEnvironmentVariable("BASE_URL"),
});

const result = await runCookingAgent({
	model,
	input,
});

console.log(result.output);
