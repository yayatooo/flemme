import { runEvalCli } from "@anvia/core/evals";
import { runActiveCooking } from "../index";
import { activeCookingCases } from "./cases/active-cooking-cases";
import { createEvalModel } from "./config";
import { activeCookingMetrics } from "./metrics/active-cooking-metrics";

export async function runActiveCookingEval(
	options: { exitCode?: boolean } = {},
) {
	const model = createEvalModel();
	return runEvalCli({
		name: "flemme-active-cooking-deterministic",
		cases: activeCookingCases,
		target: (input) => runActiveCooking({ model, input }),
		metrics: activeCookingMetrics,
		concurrency: 1,
		caseTimeoutMs: 90_000,
		format: "pretty",
		exitCode: options.exitCode ?? true,
	});
}

if (import.meta.main) {
	try {
		await runActiveCookingEval();
	} catch (error) {
		console.error(
			error instanceof Error
				? error.message
				: "Unknown active-cooking eval error",
		);
		process.exitCode = 2;
	}
}
