import { LensClient } from "@anvia/lens";

import {
	LensSmokeConfigurationError,
	resolveLensSmokeConfig,
} from "./config.ts";
import { runFourPhaseSmoke } from "./four-phase-smoke.ts";
import { LENS_REPORTER_PRIVACY_OPTIONS } from "./telemetry.ts";

type SmokeErrorCategory =
	| "configuration"
	| "runtime"
	| "readiness"
	| "ingestion";

class LensFourPhaseSmokeError extends Error {
	readonly category: SmokeErrorCategory;

	constructor(category: SmokeErrorCategory) {
		super(`Lens four-phase smoke failed: ${category}`);
		this.name = "LensFourPhaseSmokeError";
		this.category = category;
	}
}

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

	let receipts: Awaited<ReturnType<typeof runFourPhaseSmoke>>;
	try {
		receipts = await runFourPhaseSmoke({
			reporter: lens.evalReporter(LENS_REPORTER_PRIVACY_OPTIONS),
			flush: () => lens.flush(),
			close: () => lens.close(),
			runtime: `node-${process.versions.node}`,
			environment: config.environment,
		});
	} catch {
		throw new LensFourPhaseSmokeError("ingestion");
	}

	console.log("smoke_status=ingested");
	for (const receipt of receipts) {
		console.log(`phase=${receipt.phase}`);
		console.log(`suite_name=${receipt.suiteName}`);
		console.log(`case_id=${receipt.caseId}`);
		console.log(`metric_name=${receipt.metricName}`);
		console.log(`run_id=${receipt.runId}`);
		console.log(`started_at=${receipt.startedAt}`);
		console.log(`result=${receipt.status}`);
		console.log(`payload_status=${receipt.payloadStatus}`);
	}
}

function assertNode24() {
	const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
	if (!Number.isInteger(major) || major < 24) {
		throw new LensFourPhaseSmokeError("runtime");
	}
}

async function assertLensReady(baseUrl: string) {
	let response: Response;
	try {
		response = await fetch(`${baseUrl}/health/ready`, {
			signal: AbortSignal.timeout(5_000),
		});
	} catch {
		throw new LensFourPhaseSmokeError("readiness");
	}
	if (!response.ok) throw new LensFourPhaseSmokeError("readiness");
}

try {
	await run();
} catch (error) {
	const category =
		error instanceof LensFourPhaseSmokeError
			? error.category
			: error instanceof LensSmokeConfigurationError
				? "configuration"
				: "ingestion";
	console.error("smoke_status=failed");
	console.error(`error_category=${category}`);
	process.exitCode = 1;
}
