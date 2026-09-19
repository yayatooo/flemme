import { z } from "zod";

export const RUNTIME_PHASE_CONFIG = {
	recommendation: {
		traceName: "flemme.runtime.recommendation",
		spanName: "agent.flemme-recommendation",
		operationName: "recommend-meal",
		promptVersion: "recommendation-v1",
		inputSchemaVersion: "recommendation-input-v1",
		outputSchemaVersion: "recommendation-output-v1",
		resultVariants: [
			"recommendations",
			"clarification",
			"no_viable_recommendation",
		],
		errorCode: "recommendation_runtime_failed",
	},
	"pre-cooking": {
		traceName: "flemme.runtime.pre-cooking",
		spanName: "agent.flemme-pre-cooking",
		operationName: "prepare-selected-recipe",
		promptVersion: "pre-cooking-v1",
		inputSchemaVersion: "pre-cooking-input-v1",
		outputSchemaVersion: "pre-cooking-output-v1",
		resultVariants: ["cooking_plan"],
		errorCode: "pre_cooking_runtime_failed",
	},
	"active-cooking": {
		traceName: "flemme.runtime.active-cooking",
		spanName: "agent.flemme-active-cooking",
		operationName: "continue-cooking",
		promptVersion: "active-cooking-v1",
		inputSchemaVersion: "active-cooking-input-v1",
		outputSchemaVersion: "active-cooking-output-v1",
		resultVariants: ["active_response"],
		errorCode: "active_cooking_runtime_failed",
	},
	completion: {
		traceName: "flemme.runtime.completion",
		spanName: "agent.flemme-completion",
		operationName: "complete-cooking",
		promptVersion: "completion-v1",
		inputSchemaVersion: "completion-input-v1",
		outputSchemaVersion: "completion-output-v1",
		resultVariants: ["completion"],
		errorCode: "completion_runtime_failed",
	},
} as const;

export type RuntimePhase = keyof typeof RUNTIME_PHASE_CONFIG;
export type RuntimeExecutionPath = "model" | "local";
export type RuntimeResultVariant =
	(typeof RUNTIME_PHASE_CONFIG)[RuntimePhase]["resultVariants"][number];

export const RECOMMENDATION_TRACE_NAME =
	RUNTIME_PHASE_CONFIG.recommendation.traceName;
export const RECOMMENDATION_PROMPT_VERSION =
	RUNTIME_PHASE_CONFIG.recommendation.promptVersion;
export const RECOMMENDATION_INPUT_SCHEMA_VERSION =
	RUNTIME_PHASE_CONFIG.recommendation.inputSchemaVersion;
export const RECOMMENDATION_OUTPUT_SCHEMA_VERSION =
	RUNTIME_PHASE_CONFIG.recommendation.outputSchemaVersion;

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._/-]+$/;
const SENSITIVE_IDENTIFIER_PATTERN =
	/(?:secret|password|credential|bearer|private[-_]?key|api[-_]?key|access[-_]?token|\b(?:sk|pk)-[a-z0-9_-]{8,})/i;
const SafeIdentifierSchema = z
	.string()
	.min(1)
	.max(128)
	.regex(SAFE_IDENTIFIER_PATTERN)
	.refine((value) => !SENSITIVE_IDENTIFIER_PATTERN.test(value));

const phaseValues = Object.keys(RUNTIME_PHASE_CONFIG) as [
	RuntimePhase,
	...RuntimePhase[],
];
const traceNameValues = Object.values(RUNTIME_PHASE_CONFIG).map(
	({ traceName }) => traceName,
) as [string, ...string[]];
const spanNameValues = Object.values(RUNTIME_PHASE_CONFIG).map(
	({ spanName }) => spanName,
) as [string, ...string[]];
const resultVariantValues = Object.values(RUNTIME_PHASE_CONFIG).flatMap(
	({ resultVariants }) => resultVariants,
) as [RuntimeResultVariant, ...RuntimeResultVariant[]];
const errorCodeValues = Object.values(RUNTIME_PHASE_CONFIG).map(
	({ errorCode }) => errorCode,
) as [string, ...string[]];

export const RuntimeTraceSchema = z
	.object({
		traceId: z.string().regex(TRACE_ID_PATTERN),
		traceName: z.enum(traceNameValues),
		spanName: z.enum(spanNameValues),
		serviceName: SafeIdentifierSchema,
		environment: SafeIdentifierSchema,
		phase: z.enum(phaseValues),
		operationName: SafeIdentifierSchema,
		promptVersion: SafeIdentifierSchema,
		inputSchemaVersion: SafeIdentifierSchema,
		outputSchemaVersion: SafeIdentifierSchema,
		modelIdentifier: SafeIdentifierSchema,
		executionPath: z.enum(["model", "local"]),
		status: z.enum(["success", "failure"]),
		resultVariant: z.enum(resultVariantValues).optional(),
		errorCode: z.enum(errorCodeValues).optional(),
		totalDurationMs: z.number().finite().nonnegative(),
		modelDurationMs: z.number().finite().nonnegative().optional(),
		inputTokens: z.number().int().nonnegative().optional(),
		outputTokens: z.number().int().nonnegative().optional(),
		samplingDecision: z.literal(true),
		syntheticCanary: z.literal(true).optional(),
		release: SafeIdentifierSchema.optional(),
	})
	.strict()
	.superRefine((trace, context) => {
		const expected = RUNTIME_PHASE_CONFIG[trace.phase];
		if (
			trace.traceName !== expected.traceName ||
			trace.spanName !== expected.spanName ||
			trace.operationName !== expected.operationName ||
			trace.promptVersion !== expected.promptVersion ||
			trace.inputSchemaVersion !== expected.inputSchemaVersion ||
			trace.outputSchemaVersion !== expected.outputSchemaVersion
		) {
			context.addIssue({
				code: "custom",
				message: "Runtime trace identity does not match its phase",
			});
		}
		if (trace.phase !== "active-cooking" && trace.executionPath !== "model") {
			context.addIssue({
				code: "custom",
				message: "Only Active Cooking supports local execution",
			});
		}
		if (
			trace.executionPath === "local" &&
			(trace.modelDurationMs !== undefined ||
				trace.inputTokens !== undefined ||
				trace.outputTokens !== undefined)
		) {
			context.addIssue({
				code: "custom",
				message: "Local execution cannot report model timing or usage",
			});
		}
		if (trace.status === "success") {
			if (
				trace.resultVariant === undefined ||
				!expected.resultVariants.some(
					(variant) => variant === trace.resultVariant,
				) ||
				trace.errorCode !== undefined
			) {
				context.addIssue({
					code: "custom",
					message: "Runtime success fields do not match their phase",
				});
			}
		} else if (
			trace.errorCode !== expected.errorCode ||
			trace.resultVariant !== undefined
		) {
			context.addIssue({
				code: "custom",
				message: "Runtime failure fields do not match their phase",
			});
		}
	});

export type RuntimeTrace = z.infer<typeof RuntimeTraceSchema>;
export type RecommendationTrace = RuntimeTrace;

export interface RuntimeTraceObserver {
	readonly environment: string;
	readonly release?: string;
	readonly serviceName: string;
	readonly syntheticCanary?: true;
	shouldSample(traceId: string): boolean;
	record(trace: RuntimeTrace): void;
	flush(): Promise<void>;
}
export type RecommendationTraceObserver = RuntimeTraceObserver;

interface ObservedRuntimeResult<Output> {
	output: Output;
	resultVariant: RuntimeResultVariant;
	executionPath: RuntimeExecutionPath;
	modelDurationMs?: number | undefined;
	inputTokens?: number | undefined;
	outputTokens?: number | undefined;
}

export async function observeRuntimeExecution<Output>({
	phase,
	modelIdentifier,
	observability,
	execute,
}: {
	phase: RuntimePhase;
	modelIdentifier: string;
	observability?: RuntimeTraceObserver;
	execute: () => Promise<ObservedRuntimeResult<Output>>;
}): Promise<Output> {
	const traceId = createRuntimeTraceId();
	const sampled = observability?.shouldSample(traceId) ?? false;
	const startedAt = performance.now();
	let executionPath: RuntimeExecutionPath = "model";
	try {
		const result = await execute();
		executionPath = result.executionPath;
		if (sampled && observability) {
			recordFailOpen(observability, {
				...traceBase({
					phase,
					modelIdentifier,
					executionPath,
					observability,
					traceId,
					totalDurationMs: performance.now() - startedAt,
					modelDurationMs: result.modelDurationMs,
					inputTokens: result.inputTokens,
					outputTokens: result.outputTokens,
				}),
				status: "success",
				resultVariant: result.resultVariant,
			});
		}
		return result.output;
	} catch (error) {
		if (sampled && observability) {
			recordFailOpen(observability, {
				...traceBase({
					phase,
					modelIdentifier,
					executionPath,
					observability,
					traceId,
					totalDurationMs: performance.now() - startedAt,
				}),
				status: "failure",
				errorCode: RUNTIME_PHASE_CONFIG[phase].errorCode,
			});
		}
		throw error;
	}
}

export function parseRuntimeTrace(value: unknown): RuntimeTrace {
	return RuntimeTraceSchema.parse(value);
}
export function serializeRuntimeTrace(trace: RuntimeTrace): string {
	return JSON.stringify(parseRuntimeTrace(trace));
}
export function parseRecommendationTrace(value: unknown): RecommendationTrace {
	const trace = parseRuntimeTrace(value);
	if (trace.phase !== "recommendation") {
		throw new TypeError("Recommendation trace phase is invalid");
	}
	return trace;
}
export function serializeRecommendationTrace(trace: RecommendationTrace) {
	return JSON.stringify(parseRecommendationTrace(trace));
}
export function createRuntimeTraceId(): string {
	return crypto.randomUUID().replaceAll("-", "");
}
export const createRecommendationTraceId = createRuntimeTraceId;

export function isRuntimeTraceSampled(traceId: string, sampleRate: number) {
	if (!TRACE_ID_PATTERN.test(traceId)) {
		throw new TypeError("Runtime trace ID must be 32 lowercase hex characters");
	}
	if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
		throw new TypeError("Runtime sample rate must be between 0 and 1");
	}
	if (sampleRate === 0) return false;
	if (sampleRate === 1) return true;
	return Number.parseInt(traceId.slice(0, 8), 16) / 0x1_0000_0000 < sampleRate;
}
export const isRecommendationTraceSampled = isRuntimeTraceSampled;

function traceBase({
	phase,
	modelIdentifier,
	executionPath,
	observability,
	traceId,
	totalDurationMs,
	modelDurationMs,
	inputTokens,
	outputTokens,
}: {
	phase: RuntimePhase;
	modelIdentifier: string;
	executionPath: RuntimeExecutionPath;
	observability: RuntimeTraceObserver;
	traceId: string;
	totalDurationMs: number;
	modelDurationMs?: number | undefined;
	inputTokens?: number | undefined;
	outputTokens?: number | undefined;
}) {
	const config = RUNTIME_PHASE_CONFIG[phase];
	return {
		traceId,
		traceName: config.traceName,
		spanName: config.spanName,
		serviceName: observability.serviceName,
		environment: observability.environment,
		phase,
		operationName: config.operationName,
		promptVersion: config.promptVersion,
		inputSchemaVersion: config.inputSchemaVersion,
		outputSchemaVersion: config.outputSchemaVersion,
		modelIdentifier,
		executionPath,
		totalDurationMs,
		...(modelDurationMs === undefined ? {} : { modelDurationMs }),
		...(inputTokens === undefined ? {} : { inputTokens }),
		...(outputTokens === undefined ? {} : { outputTokens }),
		samplingDecision: true as const,
		...(observability.syntheticCanary
			? { syntheticCanary: true as const }
			: {}),
		...(observability.release ? { release: observability.release } : {}),
	};
}

function recordFailOpen(observability: RuntimeTraceObserver, trace: unknown) {
	try {
		observability.record(parseRuntimeTrace(trace));
	} catch {
		console.warn("runtime_observability=record_failed");
	}
}
