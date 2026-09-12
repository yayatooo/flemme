import {
	type ActiveCookingAction,
	type ActiveCookingInput,
	ActiveCookingInputSchema,
	createOpenAIModel,
	runActiveCooking,
} from "../index";
import { AYAM_KECAP_COOKING_PLAN } from "../src/fixtures/ayam-kecap-cooking-plan";

const PREPARATION_STEP_IDS = [
	"prep-cut-chicken",
	"prep-slice-aromatics",
	"prep-measure-sauce",
];

const SCENARIOS = {
	guidance: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-aromatics",
			currentStepId: "heat-oil",
			completedStepIds: PREPARATION_STEP_IDS,
			changes: [],
		},
		message: "sekarang aku harus ngapain?",
	},
	advance: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-aromatics",
			currentStepId: "heat-oil",
			completedStepIds: PREPARATION_STEP_IDS,
			changes: [],
		},
		message: "udah selesai",
	},
	pause: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-aromatics",
			currentStepId: "saute-aromatics",
			completedStepIds: [...PREPARATION_STEP_IDS, "heat-oil"],
			changes: [],
		},
		message: "pause dulu",
	},
	"missing-ingredient": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-finish-sauce",
			currentStepId: "add-sauce",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
				"brown-chicken",
			],
			changes: [],
		},
		message: "kecapnya habis, aku beli dulu",
	},
	resume: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "paused",
			pauseReason: "missing-ingredient",
			currentStageId: "stage-finish-sauce",
			currentStepId: "add-sauce",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
				"brown-chicken",
			],
			changes: [
				{
					kind: "ingredient",
					description: "Sweet soy sauce is unavailable.",
					relatedStepId: "add-sauce",
				},
			],
		},
		message: "kecapnya sudah ada, lanjut",
	},
	"equipment-interruption": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-chicken",
			currentStepId: "brown-chicken",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
			],
			changes: [],
		},
		message: "gas habis",
	},
	"previous-step": {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-chicken",
			currentStepId: "add-chicken",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
			],
			changes: [],
		},
		message: "balik satu step",
	},
	clarify: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-chicken",
			currentStepId: "add-chicken",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
			],
			changes: [],
		},
		message: "belum",
	},
	complete: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-finish-sauce",
			currentStepId: "finish-and-taste",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
				"brown-chicken",
				"add-sauce",
				"simmer-chicken",
			],
			changes: [],
		},
		message: "udah selesai semuanya",
	},
	abandon: {
		cookingPlan: AYAM_KECAP_COOKING_PLAN,
		session: {
			status: "active",
			currentStageId: "stage-cook-chicken",
			currentStepId: "brown-chicken",
			completedStepIds: [
				...PREPARATION_STEP_IDS,
				"heat-oil",
				"saute-aromatics",
				"add-chicken",
			],
			changes: [],
		},
		message: "batal masak, stop sesi ini",
	},
} satisfies Record<string, ActiveCookingInput>;

type ScenarioName = keyof typeof SCENARIOS;

function getRequiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];

	if (!value) {
		throw new Error(`${name} is missing`);
	}

	return value;
}

function formatAction(action: ActiveCookingAction) {
	if (action.type === "pause") {
		return `${action.type}: ${action.reason}`;
	}

	if (action.type === "record-change") {
		const relatedStep = action.change.relatedStepId
			? ` (step: ${action.change.relatedStepId})`
			: "";

		return `${action.type}: ${action.change.kind} — ${action.change.description}${relatedStep}`;
	}

	return action.type;
}

function printInput(name: ScenarioName, input: ActiveCookingInput) {
	const currentStage = input.cookingPlan.cookingStages.find(
		(stage) => stage.id === input.session.currentStageId,
	);
	const currentStep = currentStage?.steps.find(
		(step) => step.id === input.session.currentStepId,
	);

	console.log(`\n=== ACTIVE COOKING INPUT: ${name} ===\n`);
	console.log(`Status: ${input.session.status}`);
	console.log(`Current stage: ${currentStage?.title} (${currentStage?.id})`);
	console.log(`Current step: ${currentStep?.instruction} (${currentStep?.id})`);
	console.log(`Message: ${JSON.stringify(input.message)}`);
}

async function runScenario(
	name: ScenarioName,
	model: ReturnType<typeof createOpenAIModel>,
) {
	const input = ActiveCookingInputSchema.parse(SCENARIOS[name]);
	printInput(name, input);

	const result = await runActiveCooking({ model, input });

	console.log("\n=== ACTIVE COOKING OUTPUT ===\n");
	console.log(`Reply: ${result.reply}`);
	console.log("Actions:");

	if (result.actions.length === 0) {
		console.log("- none");
	} else {
		for (const action of result.actions) {
			console.log(`- ${formatAction(action)}`);
		}
	}
}

const scenarioArgument = Bun.argv[2] ?? "guidance";
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
