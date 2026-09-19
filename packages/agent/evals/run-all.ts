import type { EvalSuiteResult } from "@anvia/core/evals";
import { runActiveCookingEval } from "./active-cooking.eval";
import { runCompletionEval } from "./completion.eval";
import { runPreCookingEval } from "./pre-cooking.eval";
import { runRecommendationEval } from "./recommendation.eval";

function failed(result: EvalSuiteResult<unknown, unknown, unknown>) {
	return (
		result.cases.failed > 0 ||
		result.cases.invalid > 0 ||
		result.metrics.failed > 0 ||
		result.metrics.invalid > 0
	);
}

try {
	const results = [
		await runRecommendationEval({ exitCode: false }),
		await runPreCookingEval({ exitCode: false }),
		await runActiveCookingEval({ exitCode: false }),
		await runCompletionEval({ exitCode: false }),
	];
	process.exitCode = results.some((result) => failed(result)) ? 1 : 0;
} catch (error) {
	console.error(
		error instanceof Error ? error.message : "Unknown eval configuration error",
	);
	process.exitCode = 2;
}
