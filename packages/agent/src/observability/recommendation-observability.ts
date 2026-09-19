import { z } from "zod";

export const RECOMMENDATION_TRACE_NAME = "flemme.runtime.recommendation";
export const RECOMMENDATION_PROMPT_VERSION = "recommendation-v1";
export const RECOMMENDATION_INPUT_SCHEMA_VERSION = "recommendation-input-v1";
export const RECOMMENDATION_OUTPUT_SCHEMA_VERSION = "recommendation-output-v1";

const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._/-]+$/;
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;

const SafeIdentifierSchema = z
	.string()
	.min(1)
	.max(128)
	.regex(SAFE_IDENTIFIER_PATTERN);

const RecommendationTraceBaseSchema = z
	.object({
		traceId: z.string().regex(TRACE_ID_PATTERN),
		traceName: z.literal(RECOMMENDATION_TRACE_NAME),
		serviceName: SafeIdentifierSchema,
		environment: SafeIdentifierSchema,
		phase: z.literal("recommendation"),
		promptVersion: z.literal(RECOMMENDATION_PROMPT_VERSION),
		inputSchemaVersion: z.literal(RECOMMENDATION_INPUT_SCHEMA_VERSION),
		outputSchemaVersion: z.literal(RECOMMENDATION_OUTPUT_SCHEMA_VERSION),
		modelIdentifier: SafeIdentifierSchema,
		totalDurationMs: z.number().finite().nonnegative(),
		modelDurationMs: z.number().finite().nonnegative().optional(),
		inputTokens: z.number().int().nonnegative().optional(),
		outputTokens: z.number().int().nonnegative().optional(),
		samplingDecision: z.literal(true),
		release: SafeIdentifierSchema.optional(),
	})
	.strict();

export const RecommendationTraceSchema = z.discriminatedUnion("status", [
	RecommendationTraceBaseSchema.extend({
		status: z.literal("success"),
		resultVariant: z.enum([
			"recommendations",
			"clarification",
			"no_viable_recommendation",
		]),
	}).strict(),
	RecommendationTraceBaseSchema.extend({
		status: z.literal("failure"),
		errorCode: z.literal("recommendation_runtime_failed"),
	}).strict(),
]);

export type RecommendationTrace = z.infer<typeof RecommendationTraceSchema>;

export interface RecommendationTraceObserver {
	readonly environment: string;
	readonly release?: string;
	readonly serviceName: string;
	shouldSample(traceId: string): boolean;
	record(trace: RecommendationTrace): void;
	flush(): Promise<void>;
}

export function parseRecommendationTrace(value: unknown): RecommendationTrace {
	return RecommendationTraceSchema.parse(value);
}

export function serializeRecommendationTrace(
	trace: RecommendationTrace,
): string {
	return JSON.stringify(parseRecommendationTrace(trace));
}

export function createRecommendationTraceId(): string {
	return crypto.randomUUID().replaceAll("-", "");
}

export function isRecommendationTraceSampled(
	traceId: string,
	sampleRate: number,
): boolean {
	if (!TRACE_ID_PATTERN.test(traceId)) {
		throw new TypeError(
			"Recommendation trace ID must be 32 lowercase hex characters",
		);
	}
	if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
		throw new TypeError("Recommendation sample rate must be between 0 and 1");
	}
	if (sampleRate === 0) return false;
	if (sampleRate === 1) return true;

	const prefix = Number.parseInt(traceId.slice(0, 8), 16);
	return prefix / 0x1_0000_0000 < sampleRate;
}
