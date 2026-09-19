import {
	createEvalTypes,
	EvalOutcome,
	type EvalReporter,
	runEvalSuite,
} from "@anvia/core/evals";

import { allowlistTelemetryMetadata } from "./telemetry.ts";

export const FOUR_PHASE_SMOKE_DEFINITIONS = [
	{
		phase: "recommendation",
		intent: "recommend-meal",
		suiteName: "flemme.eval.smoke.recommendation",
		caseId: "flemme-synthetic-recommendation-001",
	},
	{
		phase: "pre-cooking",
		intent: "create-cooking-plan",
		suiteName: "flemme.eval.smoke.pre-cooking",
		caseId: "flemme-synthetic-pre-cooking-001",
	},
	{
		phase: "active-cooking",
		intent: "continue-cooking",
		suiteName: "flemme.eval.smoke.active-cooking",
		caseId: "flemme-synthetic-active-cooking-001",
	},
	{
		phase: "completion",
		intent: "complete-cooking",
		suiteName: "flemme.eval.smoke.completion",
		caseId: "flemme-synthetic-completion-001",
	},
] as const;

export const FOUR_PHASE_METRIC_NAME = "flemme-synthetic-contract";
const SYNTHETIC_INPUT = "synthetic-input-redacted";
const SYNTHETIC_OUTPUT = "synthetic-output-redacted";

const { defineMetric } = createEvalTypes<string, string, undefined>();

const syntheticContractMetric = defineMetric({
	name: FOUR_PHASE_METRIC_NAME,
	required: true,
	dataType: "BOOLEAN",
	metadata: allowlistTelemetryMetadata({
		metricName: FOUR_PHASE_METRIC_NAME,
		synthetic: true,
	}),
	evaluate: ({ output }) =>
		output === SYNTHETIC_OUTPUT
			? EvalOutcome.pass(true)
			: EvalOutcome.fail(false),
});

export interface FourPhaseSmokeReceipt {
	phase: (typeof FOUR_PHASE_SMOKE_DEFINITIONS)[number]["phase"];
	suiteName: string;
	caseId: string;
	metricName: typeof FOUR_PHASE_METRIC_NAME;
	runId: string;
	startedAt: string;
	status: "pass";
	payloadStatus: "not_requested";
}

interface FourPhaseSmokeOptions {
	reporter: EvalReporter<string, string, unknown>;
	flush: () => Promise<void>;
	close: () => Promise<void>;
	runtime: string;
	environment: string;
}

export async function runFourPhaseSmoke({
	reporter,
	flush,
	close,
	runtime,
	environment,
}: FourPhaseSmokeOptions): Promise<FourPhaseSmokeReceipt[]> {
	const receipts: FourPhaseSmokeReceipt[] = [];
	try {
		for (const definition of FOUR_PHASE_SMOKE_DEFINITIONS) {
			const result = await runEvalSuite({
				name: definition.suiteName,
				run: {
					datasetName: "flemme-synthetic-smoke",
					datasetVersion: "2",
					metadata: allowlistTelemetryMetadata({
						phase: definition.phase,
						intent: definition.intent,
						evalSuiteVersion: "2",
						runtime,
						environment,
						modelIdentifier: "synthetic-static",
						synthetic: true,
					}),
				},
				cases: [
					{
						id: definition.caseId,
						input: SYNTHETIC_INPUT,
						metadata: allowlistTelemetryMetadata({
							phase: definition.phase,
							intent: definition.intent,
							caseId: definition.caseId,
							synthetic: true,
						}),
					},
				],
				target: () => SYNTHETIC_OUTPUT,
				metrics: [syntheticContractMetric],
				reporters: [reporter],
				reporterErrorPolicy: "throw",
				concurrency: 1,
			});

			if (
				result.cases.total !== 1 ||
				result.cases.passed !== 1 ||
				result.metrics.total !== 1 ||
				result.metrics.passed !== 1 ||
				result.reporterErrors.length !== 0
			) {
				throw new Error("four_phase_smoke_result_invalid");
			}

			receipts.push({
				phase: definition.phase,
				suiteName: definition.suiteName,
				caseId: definition.caseId,
				metricName: FOUR_PHASE_METRIC_NAME,
				runId: result.run.id,
				startedAt: result.run.startedAt,
				status: "pass",
				payloadStatus: "not_requested",
			});
		}
		await flush();
		return receipts;
	} finally {
		await close();
	}
}
