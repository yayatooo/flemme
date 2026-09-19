const SAFE_METADATA_KEYS = [
	"phase",
	"intent",
	"promptVersion",
	"schemaVersion",
	"evalSuiteVersion",
	"caseId",
	"metricName",
	"runtime",
	"environment",
	"modelIdentifier",
] as const;

type SafeMetadataKey = (typeof SAFE_METADATA_KEYS)[number];
type SafeMetadataValue = string | number | boolean;
export type SafeTelemetryMetadata = Partial<
	Record<SafeMetadataKey, SafeMetadataValue>
>;

const safeMetadataKeySet = new Set<string>(SAFE_METADATA_KEYS);

export const LENS_REPORTER_PRIVACY_OPTIONS = Object.freeze({
	includePayloads: false,
	includeMetadata: true,
	onMissingTrace: "emit" as const,
	redactInputs: true,
	redactOutputs: true,
	redactErrors: true,
	redactMetadata: true,
});

export function allowlistTelemetryMetadata(
	metadata: Readonly<Record<string, unknown>>,
): SafeTelemetryMetadata {
	for (const key of Object.keys(metadata)) {
		if (!safeMetadataKeySet.has(key)) {
			throw new TypeError(`Telemetry metadata field is not allowed: ${key}`);
		}
	}

	const safe: SafeTelemetryMetadata = {};
	for (const key of SAFE_METADATA_KEYS) {
		const value = metadata[key];
		if (value === undefined) continue;
		if (
			(typeof value !== "string" &&
				typeof value !== "number" &&
				typeof value !== "boolean") ||
			(typeof value === "number" && !Number.isFinite(value))
		) {
			throw new TypeError(
				`Telemetry metadata field must be a finite primitive: ${key}`,
			);
		}
		safe[key] = value;
	}
	return safe;
}

export function serializeSafeTelemetryMetadata(
	metadata: Readonly<Record<string, unknown>>,
) {
	return JSON.stringify(allowlistTelemetryMetadata(metadata));
}
