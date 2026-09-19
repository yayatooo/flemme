import { runEvalCli } from "@anvia/core/evals";
import { runCompletion } from "../index";
import { completionCases } from "./cases/completion-cases";
import { createEvalModel } from "./config";
import { completionMetrics } from "./metrics/completion-metrics";

export async function runCompletionEval(options: { exitCode?: boolean } = {}) {
	const model = createEvalModel();
	return runEvalCli({
		name: "flemme-completion-deterministic",
		cases: completionCases,
		target: (input) => runCompletion({ model, input }),
		metrics: completionMetrics,
		concurrency: 1,
		caseTimeoutMs: 90_000,
		format: "pretty",
		exitCode: options.exitCode ?? true,
	});
}

if (import.meta.main) {
	try {
		await runCompletionEval();
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "Unknown completion eval error",
		);
		process.exitCode = 2;
	}
}
