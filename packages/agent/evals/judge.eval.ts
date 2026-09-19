import { llmScore, runEvalCli } from "@anvia/core/evals";
import {
	runActiveCooking,
	runCompletion,
	runCookingAgent,
	runPreCooking,
} from "../index";
import { activeCookingCases } from "./cases/active-cooking-cases";
import { completionCases } from "./cases/completion-cases";
import { preCookingCases } from "./cases/pre-cooking-cases";
import { recommendationCases } from "./cases/recommendation-cases";
import { createEvalModel, judgeModelId } from "./config";

const targetModel = createEvalModel();
const judgeModel = createEvalModel(judgeModelId());
const threshold = 0.8;

function required<T>(value: T | undefined): T {
	if (value === undefined) throw new Error("Judge eval fixture is missing");
	return value;
}

const commonJudgeOptions = {
	model: judgeModel,
	threshold,
	retries: 0,
	input: ({ input }: { input: unknown }) => JSON.stringify(input),
	actual: ({ output }: { output: unknown }) => JSON.stringify(output),
};

try {
	const results = [
		await runEvalCli({
			name: "flemme-judge-recommendation",
			cases: [required(recommendationCases[0])],
			target: (context) => runCookingAgent({ model: targetModel, context }),
			metrics: [
				llmScore({
					...commonJudgeOptions,
					name: "recommendation-practical-usefulness",
					criteria:
						"The recommendation is practical for the supplied inventory, equipment, household, time, and request, and explains its usefulness without unsupported claims.",
				}),
				llmScore({
					...commonJudgeOptions,
					name: "recommendation-request-alignment",
					criteria:
						"The response directly addresses the current session request rather than merely restating stored preferences.",
				}),
			],
			concurrency: 1,
			caseTimeoutMs: 120_000,
			exitCode: false,
		}),
		await runEvalCli({
			name: "flemme-judge-pre-cooking",
			cases: [required(preCookingCases[0])],
			target: (input) => runPreCooking({ model: targetModel, input }),
			metrics: [
				llmScore({
					...commonJudgeOptions,
					name: "pre-cooking-clarity",
					criteria:
						"The plan is clear, ordered, executable, and easy for a home cook to follow while preserving the selected recipe.",
				}),
			],
			concurrency: 1,
			caseTimeoutMs: 120_000,
			exitCode: false,
		}),
		await runEvalCli({
			name: "flemme-judge-active-cooking",
			cases: [required(activeCookingCases[2])],
			target: (input) => runActiveCooking({ model: targetModel, input }),
			metrics: [
				llmScore({
					...commonJudgeOptions,
					name: "active-cooking-calm-helpfulness",
					criteria:
						"The reply is calm, concise, helpful in the current cooking situation, and does not overstate what the application changed.",
				}),
			],
			concurrency: 1,
			caseTimeoutMs: 120_000,
			exitCode: false,
		}),
		await runEvalCli({
			name: "flemme-judge-completion",
			cases: [required(completionCases[2])],
			target: (input) => runCompletion({ model: targetModel, input }),
			metrics: [
				llmScore({
					...commonJudgeOptions,
					name: "completion-grounded-synthesis",
					criteria:
						"The completion accurately and naturally synthesizes the supplied cooking plan and recorded experience without inventing events or side effects.",
				}),
			],
			concurrency: 1,
			caseTimeoutMs: 120_000,
			exitCode: false,
		}),
	];

	process.exitCode = results.some(
		(result) => result.cases.failed > 0 || result.cases.invalid > 0,
	)
		? 1
		: 0;
} catch (error) {
	console.error(
		error instanceof Error ? error.message : "Unknown judge eval error",
	);
	process.exitCode = 2;
}
