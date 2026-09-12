import {
	type CompletionInput,
	CompletionInputSchema,
	createOpenAIModel,
	runCompletion,
} from "../index";
import {
	AYAM_KECAP_COMPLETED_SESSION,
	AYAM_KECAP_COOKING_PLAN,
} from "../src/fixtures/ayam-kecap-cooking-plan";

const SCENARIOS = {
	normal: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: AYAM_KECAP_COMPLETED_SESSION,
		message: "udah selesai",
	},
	"no-message": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: AYAM_KECAP_COMPLETED_SESSION,
	},
	positive: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: AYAM_KECAP_COMPLETED_SESSION,
		message: "selesai, enak juga",
	},
	salty: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: AYAM_KECAP_COMPLETED_SESSION,
		message: "selesai, agak keasinan",
	},
	"ingredient-adjustment": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			...AYAM_KECAP_COMPLETED_SESSION,
			changes: [
				{
					kind: "ingredient",
					description: "User added more salt while finishing the sauce.",
					relatedStepId: "finish-and-taste",
				},
			],
		},
	},
	"serving-adjustment": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			...AYAM_KECAP_COMPLETED_SESSION,
			changes: [
				{
					kind: "servings",
					description: "Serving quantity changed from 2 to 3 during cooking.",
				},
			],
		},
		message: "selesai",
	},
	"equipment-recovered": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			...AYAM_KECAP_COMPLETED_SESSION,
			changes: [
				{
					kind: "equipment",
					description:
						"The gas supply ran out temporarily and was restored before cooking resumed.",
					relatedStepId: "brown-chicken",
				},
			],
		},
		message: "akhirnya selesai",
	},
	"final-modification": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: AYAM_KECAP_COMPLETED_SESSION,
		message: "done, tadi aku tambah sedikit cabe",
	},
} satisfies Record<string, CompletionInput>;

type ScenarioName = keyof typeof SCENARIOS;

function getRequiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];

	if (!value) {
		throw new Error(`${name} is missing`);
	}

	return value;
}

function printInput(name: ScenarioName, input: CompletionInput) {
	console.log(`\n=== COMPLETION INPUT: ${name} ===\n`);
	console.log(`Plan: ${input.cookingPlan.preparationSummary.overview}`);
	console.log(`Status: ${input.session.status}`);
	console.log(`Final message: ${JSON.stringify(input.message ?? "none")}`);
	console.log("Changes:");

	if (input.session.changes.length === 0) {
		console.log("- none");
	} else {
		for (const change of input.session.changes) {
			console.log(`- ${change.kind}: ${change.description}`);
		}
	}
}

async function runScenario(
	name: ScenarioName,
	model: ReturnType<typeof createOpenAIModel>,
) {
	const input = CompletionInputSchema.parse(SCENARIOS[name]);
	printInput(name, input);

	const result = await runCompletion({ model, input });

	console.log("\n=== COMPLETION OUTPUT ===\n");
	console.log(`Reply: ${result.reply}`);
	console.log(`Summary: ${result.summary.title}`);
	console.log(result.summary.description);
	console.log("Notes:");

	if (result.notes.length === 0) {
		console.log("- none");
	} else {
		for (const note of result.notes) {
			console.log(`- ${note}`);
		}
	}
}

const scenarioArgument = Bun.argv[2] ?? "normal";
const scenarioNames = Object.keys(SCENARIOS) as ScenarioName[];

if (scenarioArgument === "--list") {
	console.log(scenarioNames.join("\n"));
	process.exit(0);
}

if (
	scenarioArgument !== "all" &&
	!scenarioNames.includes(scenarioArgument as ScenarioName)
) {
	throw new Error(
		`Unknown scenario: ${scenarioArgument}. Use one of: ${scenarioNames.join(", ")}, all`,
	);
}

const model = createOpenAIModel({
	apiKey: getRequiredEnvironmentVariable("MUX_API_KEY"),
	baseUrl: getRequiredEnvironmentVariable("BASE_URL"),
	modelId: "gpt-5.6-luna",
});

try {
	if (scenarioArgument === "all") {
		for (const name of scenarioNames) {
			await runScenario(name, model);
		}
	} else {
		await runScenario(scenarioArgument as ScenarioName, model);
	}
} catch (error) {
	console.error(error);
	process.exit(1);
}
