import { runEvalCli } from "@anvia/core/evals";
import { runCookingAgent } from "../index";
import {
	recommendationCases,
	recommendationSmokeCases,
} from "./cases/recommendation-cases";
import { createEvalModel } from "./config";
import { recommendationMetrics } from "./metrics/recommendation-metrics";

export async function runRecommendationEval(
	options: { smoke?: boolean; exitCode?: boolean } = {},
) {
	const model = createEvalModel();
	return runEvalCli({
		name: options.smoke
			? "flemme-recommendation-smoke"
			: "flemme-recommendation-deterministic",
		cases: options.smoke ? recommendationSmokeCases : recommendationCases,
		target: (context) => runCookingAgent({ model, context }),
		metrics: recommendationMetrics,
		concurrency: 1,
		caseTimeoutMs: 90_000,
		format: "pretty",
		exitCode: options.exitCode ?? true,
	});
}

if (import.meta.main) {
	try {
		await runRecommendationEval({ smoke: Bun.argv.includes("--smoke") });
	} catch (error) {
		console.error(
			error instanceof Error
				? error.message
				: "Unknown recommendation eval error",
		);
		process.exitCode = 2;
	}
}
