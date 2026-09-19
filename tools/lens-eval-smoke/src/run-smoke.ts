import { createEvalTypes, EvalOutcome, runEvalSuite } from "@anvia/core/evals";
import { LensClient } from "@anvia/lens";
import {
	LensSmokeConfigurationError,
	resolveLensSmokeConfig,
} from "./config.ts";
import {
	allowlistTelemetryMetadata,
	LENS_REPORTER_PRIVACY_OPTIONS,
} from "./telemetry.ts";

const SUITE_NAME = "flemme.eval.smoke.recommendation";
const CASE_ID = "flemme-synthetic-recommendation-001";
const METRIC_NAME = "flemme-synthetic-contract";
const SYNTHETIC_INPUT = "synthetic-input-redacted";
const SYNTHETIC_OUTPUT = "synthetic-output-redacted";

type SmokeErrorCategory =
	| "configuration"
	| "runtime"
	| "readiness"
	| "ingestion";

class LensSmokeError extends Error {
	readonly category: SmokeErrorCategory;

	constructor(category: SmokeErrorCategory) {
		super(`Lens smoke failed: ${category}`);
		this.name = "LensSmokeError";
		this.category = category;
	}
}

const { defineMetric } = createEvalTypes<string, string, undefined>();

const syntheticContractMetric = defineMetric({
	name: METRIC_NAME,
	required: true,
	dataType: "BOOLEAN",
	metadata: allowlistTelemetryMetadata({ metricName: METRIC_NAME }),
	evaluate: ({ output }) =>
		output === SYNTHETIC_OUTPUT
			? EvalOutcome.pass(true, {
					comment: "Synthetic smoke output matched the deterministic contract.",
				})
			: EvalOutcome.fail(false, {
					comment:
						"Synthetic smoke output did not match the deterministic contract.",
				}),
});

async function run() {
	assertNode24();
	const config = resolveLensSmokeConfig(process.env);
	await assertLensReady(config.baseUrl);

	const lens = new LensClient({
		...config,
		captureMode: "safe",
		redactInputs: true,
		redactOutputs: true,
		redactErrors: true,
		redactMetadata: true,
		timeoutMs: 15_000,
	});

	try {
		const result = await runEvalSuite({
			name: SUITE_NAME,
			run: {
				datasetName: "flemme-synthetic-smoke",
				datasetVersion: "1",
				metadata: allowlistTelemetryMetadata({
					phase: "recommendation",
					intent: "recommend-meal",
					promptVersion: "smoke-v1",
					schemaVersion: "smoke-v1",
					evalSuiteVersion: "1",
					runtime: `node-${process.versions.node}`,
					environment: config.environment,
					modelIdentifier: "synthetic-static",
				}),
			},
			cases: [
				{
					id: CASE_ID,
					input: SYNTHETIC_INPUT,
					metadata: allowlistTelemetryMetadata({
						phase: "recommendation",
						intent: "recommend-meal",
						caseId: CASE_ID,
					}),
				},
			],
			target: () => SYNTHETIC_OUTPUT,
			metrics: [syntheticContractMetric],
			reporters: [lens.evalReporter(LENS_REPORTER_PRIVACY_OPTIONS)],
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
			throw new LensSmokeError("ingestion");
		}

		await lens.flush();
		await lens.close();
		console.log("smoke_status=ingested");
		console.log(`suite_name=${result.name}`);
		console.log(`case_id=${CASE_ID}`);
		console.log(`run_id=${result.run.id}`);
		console.log(`started_at=${result.run.startedAt}`);
		console.log("payloads_included=false");
	} catch (error) {
		if (error instanceof LensSmokeError) throw error;
		throw new LensSmokeError("ingestion");
	} finally {
		await lens.close();
	}
}

function assertNode24() {
	const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
	if (!Number.isInteger(major) || major < 24) {
		throw new LensSmokeError("runtime");
	}
}

async function assertLensReady(baseUrl: string) {
	let response: Response;
	try {
		response = await fetch(`${baseUrl}/health/ready`, {
			signal: AbortSignal.timeout(5_000),
		});
	} catch {
		throw new LensSmokeError("readiness");
	}
	if (!response.ok) throw new LensSmokeError("readiness");
}

try {
	await run();
} catch (error) {
	const category =
		error instanceof LensSmokeError
			? error.category
			: error instanceof LensSmokeConfigurationError
				? "configuration"
				: "ingestion";
	console.error("smoke_status=failed");
	console.error(`error_category=${category}`);
	process.exitCode = 1;
}
