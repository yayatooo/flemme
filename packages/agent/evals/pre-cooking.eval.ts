import { runEvalCli } from "@anvia/core/evals";
import { runPreCooking } from "../index";
import { preCookingCases } from "./cases/pre-cooking-cases";
import { createEvalModel } from "./config";
import { preCookingMetrics } from "./metrics/pre-cooking-metrics";

export async function runPreCookingEval(options: { exitCode?: boolean } = {}) {
	const model = createEvalModel();
	return runEvalCli({
		name: "flemme-pre-cooking-deterministic",
		cases: preCookingCases,
		target: (input) => runPreCooking({ model, input }),
		metrics: preCookingMetrics,
		concurrency: 1,
		caseTimeoutMs: 90_000,
		format: "pretty",
		exitCode: options.exitCode ?? true,
	});
}

if (import.meta.main) {
	try {
		await runPreCookingEval();
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "Unknown pre-cooking eval error",
		);
		process.exitCode = 2;
	}
}
