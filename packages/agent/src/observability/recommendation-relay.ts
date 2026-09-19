import {
	isRecommendationTraceSampled,
	type RecommendationTrace,
	type RecommendationTraceObserver,
	serializeRecommendationTrace,
} from "./recommendation-observability";

const DEFAULT_SERVICE_NAME = "flemme-agent";
const DEFAULT_ENVIRONMENT = "local";
const DEFAULT_TIMEOUT_MS = 1_000;
const MAX_PENDING_DELIVERIES = 16;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._/-]+$/;

export interface RecommendationObservabilityConfig {
	enabled: boolean;
	sampleRate: number;
	relayUrl?: string;
	serviceName: string;
	environment: string;
	timeoutMs: number;
	release?: string;
}

export interface RecommendationRelayDependencies {
	fetch?: RecommendationFetch;
	diagnostic?: (code: string) => void;
}

type RecommendationFetch = (
	input: string,
	init: RequestInit,
) => Promise<Response>;

export class RecommendationObservabilityConfigurationError extends Error {
	constructor(code: string) {
		super(`Recommendation observability configuration is invalid: ${code}`);
		this.name = "RecommendationObservabilityConfigurationError";
	}
}

export function readRecommendationObservabilityConfig(
	environment: Readonly<Record<string, string | undefined>>,
): RecommendationObservabilityConfig {
	const enabled = readBoolean(
		environment.FLEMME_OBSERVABILITY_ENABLED,
		"enabled",
		false,
	);
	const sampleRate = readNumber(
		environment.FLEMME_OBSERVABILITY_SAMPLE_RATE,
		"sample_rate",
		0,
		0,
		1,
	);
	const timeoutMs = readNumber(
		environment.FLEMME_OBSERVABILITY_TIMEOUT_MS,
		"timeout_ms",
		DEFAULT_TIMEOUT_MS,
		1,
		30_000,
	);
	const serviceName = readIdentifier(
		environment.FLEMME_OBSERVABILITY_SERVICE_NAME,
		"service_name",
		DEFAULT_SERVICE_NAME,
	);
	const runtimeEnvironment = readIdentifier(
		environment.FLEMME_OBSERVABILITY_ENVIRONMENT,
		"environment",
		DEFAULT_ENVIRONMENT,
	);
	const release = readOptionalIdentifier(
		environment.FLEMME_OBSERVABILITY_RELEASE,
		"release",
	);
	const relayUrl = environment.FLEMME_OBSERVABILITY_RELAY_URL?.trim();

	if (enabled && sampleRate > 0 && !relayUrl) {
		throw new RecommendationObservabilityConfigurationError(
			"relay_url_missing",
		);
	}
	if (relayUrl) assertLoopbackRelayUrl(relayUrl);

	return {
		enabled,
		sampleRate,
		relayUrl: relayUrl || undefined,
		serviceName,
		environment: runtimeEnvironment,
		timeoutMs,
		release,
	};
}

export function createRecommendationTraceObserver(
	config: RecommendationObservabilityConfig,
	dependencies: RecommendationRelayDependencies = {},
): RecommendationTraceObserver {
	if (!config.enabled || config.sampleRate === 0) {
		return createNoopRecommendationTraceObserver(config);
	}
	if (!config.relayUrl) {
		throw new RecommendationObservabilityConfigurationError(
			"relay_url_missing",
		);
	}

	const fetchImplementation =
		dependencies.fetch ?? ((input, init) => fetch(input, init));
	const diagnostic =
		dependencies.diagnostic ??
		((code: string) => console.warn(`recommendation_observability=${code}`));
	const pending = new Set<Promise<void>>();
	const failures: string[] = [];

	return {
		serviceName: config.serviceName,
		environment: config.environment,
		release: config.release,
		shouldSample: (traceId) =>
			isRecommendationTraceSampled(traceId, config.sampleRate),
		record(trace) {
			if (pending.size >= MAX_PENDING_DELIVERIES) {
				failures.push("queue_full");
				diagnostic("queue_full");
				return;
			}

			const delivery = deliverTrace(
				config.relayUrl as string,
				config.timeoutMs,
				trace,
				fetchImplementation,
			).catch((error: unknown) => {
				const code =
					error instanceof RelayDeliveryError ? error.code : "delivery_failed";
				failures.push(code);
				diagnostic(code);
			});
			pending.add(delivery);
			void delivery.finally(() => pending.delete(delivery));
		},
		async flush() {
			await Promise.all([...pending]);
			if (failures.length > 0) {
				throw new RelayDeliveryError(failures[0] ?? "delivery_failed");
			}
		},
	};
}

class RelayDeliveryError extends Error {
	readonly code: string;

	constructor(code: string) {
		super(`Recommendation trace delivery failed: ${code}`);
		this.name = "RelayDeliveryError";
		this.code = code;
	}
}

async function deliverTrace(
	relayUrl: string,
	timeoutMs: number,
	trace: RecommendationTrace,
	fetchImplementation: RecommendationFetch,
) {
	let response: Response;
	try {
		response = await fetchImplementation(relayUrl, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: serializeRecommendationTrace(trace),
			signal: AbortSignal.timeout(timeoutMs),
		});
	} catch {
		throw new RelayDeliveryError("relay_unavailable");
	}
	if (!response.ok) throw new RelayDeliveryError("relay_rejected");
}

function createNoopRecommendationTraceObserver(
	config: RecommendationObservabilityConfig,
): RecommendationTraceObserver {
	return {
		serviceName: config.serviceName,
		environment: config.environment,
		release: config.release,
		shouldSample: () => false,
		record: () => undefined,
		flush: async () => undefined,
	};
}

function assertLoopbackRelayUrl(value: string) {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new RecommendationObservabilityConfigurationError(
			"relay_url_invalid",
		);
	}
	if (
		url.protocol !== "http:" ||
		url.hostname !== "127.0.0.1" ||
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		url.pathname !== "/v1/recommendation-traces"
	) {
		throw new RecommendationObservabilityConfigurationError(
			"relay_url_not_loopback",
		);
	}
}

function readBoolean(
	value: string | undefined,
	code: string,
	fallback: boolean,
) {
	if (value === undefined || value.trim() === "") return fallback;
	if (value === "true") return true;
	if (value === "false") return false;
	throw new RecommendationObservabilityConfigurationError(code);
}

function readNumber(
	value: string | undefined,
	code: string,
	fallback: number,
	minimum: number,
	maximum: number,
) {
	if (value === undefined || value.trim() === "") return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
		throw new RecommendationObservabilityConfigurationError(code);
	}
	return parsed;
}

function readIdentifier(
	value: string | undefined,
	code: string,
	fallback: string,
) {
	if (value === undefined || value.trim() === "") return fallback;
	return assertIdentifier(value.trim(), code);
}

function readOptionalIdentifier(value: string | undefined, code: string) {
	if (value === undefined || value.trim() === "") return undefined;
	return assertIdentifier(value.trim(), code);
}

function assertIdentifier(value: string, code: string) {
	if (value.length > 128 || !SAFE_IDENTIFIER_PATTERN.test(value)) {
		throw new RecommendationObservabilityConfigurationError(code);
	}
	return value;
}
