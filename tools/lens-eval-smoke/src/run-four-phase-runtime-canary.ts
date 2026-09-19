import { spawn } from "node:child_process";
import { once } from "node:events";
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { fileURLToPath } from "node:url";

import { LensClient } from "@anvia/lens";

import {
	parseRuntimeTrace,
	RUNTIME_PHASE_CONFIG,
	type RuntimePhase,
	type RuntimeTrace,
} from "../../../packages/agent/src/observability/recommendation-observability.ts";
import {
	LensSmokeConfigurationError,
	resolveLensSmokeConfig,
} from "./config.ts";
import {
	publishRuntimeTrace,
	type RuntimeTraceReceipt,
} from "./runtime-trace.ts";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const MAX_REQUEST_BYTES = 8_192;
const EXPECTED_PHASES = Object.keys(RUNTIME_PHASE_CONFIG) as RuntimePhase[];

type RuntimeCanaryErrorCategory =
	| "configuration"
	| "runtime"
	| "readiness"
	| "relay"
	| "ingestion";

class RuntimeCanaryError extends Error {
	readonly category: RuntimeCanaryErrorCategory;

	constructor(category: RuntimeCanaryErrorCategory) {
		super(`Four-phase runtime canary failed: ${category}`);
		this.name = "RuntimeCanaryError";
		this.category = category;
	}
}

interface DeliveredTrace {
	trace: RuntimeTrace;
	receipt: RuntimeTraceReceipt;
	timestamp: string;
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
	const observer = lens.observer({
		captureMode: "safe",
		redactInputs: true,
		redactOutputs: true,
		redactErrors: true,
		redactMetadata: true,
	});
	const delivered = new Map<RuntimePhase, DeliveredTrace>();

	const server = createServer(async (request, response) => {
		try {
			if (request.method !== "POST" || request.url !== "/v1/runtime-traces") {
				respond(response, 404);
				return;
			}
			const trace = parseRuntimeTrace(
				JSON.parse(await readRequestBody(request)),
			);
			if (!trace.syntheticCanary || delivered.has(trace.phase)) {
				respond(response, 422);
				return;
			}
			const receipt = await publishRuntimeTrace(observer, trace);
			delivered.set(trace.phase, {
				trace,
				receipt,
				timestamp: new Date().toISOString(),
			});
			respond(response, 204);
		} catch {
			respond(response, 422);
		}
	});

	try {
		server.listen(0, "127.0.0.1");
		await once(server, "listening");
		const address = server.address();
		if (!address || typeof address === "string") {
			throw new RuntimeCanaryError("relay");
		}

		const childEnvironment = Object.fromEntries(
			Object.entries(process.env).filter(
				([name, value]) =>
					!name.startsWith("ANVIA_LENS_") && value !== undefined,
			),
		);
		const child = spawn(
			"bun",
			["run", "--cwd", "packages/agent", "canary:four-phase-observability"],
			{
				cwd: REPOSITORY_ROOT,
				env: {
					...childEnvironment,
					FLEMME_OBSERVABILITY_ENABLED: "true",
					FLEMME_OBSERVABILITY_SAMPLE_RATE: "1",
					FLEMME_OBSERVABILITY_RELAY_URL: `http://127.0.0.1:${address.port}/v1/runtime-traces`,
					FLEMME_OBSERVABILITY_SERVICE_NAME: config.serviceName,
					FLEMME_OBSERVABILITY_ENVIRONMENT: config.environment,
					FLEMME_OBSERVABILITY_SYNTHETIC_CANARY: "true",
				},
				stdio: ["ignore", "ignore", "inherit"],
			},
		);
		const [exitCode] = await once(child, "exit");
		if (exitCode !== 0 || delivered.size !== EXPECTED_PHASES.length) {
			throw new RuntimeCanaryError("relay");
		}

		await lens.flush();
		await lens.close();
		console.log("runtime_canary_status=ingested");
		for (const phase of EXPECTED_PHASES) {
			const item = delivered.get(phase);
			if (!item) throw new RuntimeCanaryError("relay");
			console.log(`phase=${phase}`);
			console.log(`trace_name=${item.trace.traceName}`);
			console.log(`trace_id=${item.receipt.traceId}`);
			console.log(`root_observation_id=${item.receipt.observationId}`);
			console.log("terminal_status=success");
			console.log(`emitted_at=${item.timestamp}`);
			console.log("payload_capture=disabled");
		}
	} finally {
		server.close();
		await lens.close();
	}
}

async function readRequestBody(request: IncomingMessage) {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.byteLength;
		if (size > MAX_REQUEST_BYTES) throw new RuntimeCanaryError("relay");
		chunks.push(buffer);
	}
	return Buffer.concat(chunks).toString("utf8");
}

function respond(response: ServerResponse, statusCode: number) {
	response.writeHead(statusCode).end();
}

function assertNode24() {
	const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
	if (!Number.isInteger(major) || major < 24) {
		throw new RuntimeCanaryError("runtime");
	}
}

async function assertLensReady(baseUrl: string) {
	let response: Response;
	try {
		response = await fetch(`${baseUrl}/health/ready`, {
			signal: AbortSignal.timeout(5_000),
		});
	} catch {
		throw new RuntimeCanaryError("readiness");
	}
	if (!response.ok) throw new RuntimeCanaryError("readiness");
}

try {
	await run();
} catch (error) {
	const category =
		error instanceof RuntimeCanaryError
			? error.category
			: error instanceof LensSmokeConfigurationError
				? "configuration"
				: "ingestion";
	console.error("runtime_canary_status=failed");
	console.error(`error_category=${category}`);
	process.exitCode = 1;
}
