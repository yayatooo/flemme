import type {
	CompletionRequest,
	CompletionResponse,
	JsonObject,
	JsonValue,
	StreamingCompletionModel,
} from "@anvia/core/completion";
import { OpenAIClient } from "@anvia/openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL_ID = "openai/gpt-5.6-luna";

export interface OpenRouterModelConfig {
	apiKey: string;
	modelId?: string;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableSchema(schema: JsonObject): JsonObject {
	return {
		anyOf: [schema, { type: "null" }],
	};
}

function requiresRootWrapper(schema: JsonObject) {
	return Array.isArray(schema.oneOf);
}

function toOpenAIStrictSchema(schema: JsonObject): JsonObject {
	const normalized: JsonObject = { ...schema };
	const properties = schema.properties;

	if (isJsonObject(properties)) {
		const required = new Set(
			Array.isArray(schema.required)
				? schema.required.filter(
						(value): value is string => typeof value === "string",
					)
				: [],
		);
		const normalizedProperties: JsonObject = {};

		for (const [name, property] of Object.entries(properties)) {
			if (!isJsonObject(property)) {
				normalizedProperties[name] = property;
				continue;
			}

			const normalizedProperty = toOpenAIStrictSchema(property);
			normalizedProperties[name] = required.has(name)
				? normalizedProperty
				: nullableSchema(normalizedProperty);
		}

		normalized.properties = normalizedProperties;
		normalized.required = Object.keys(normalizedProperties);
		normalized.additionalProperties = false;
	}

	if (isJsonObject(schema.items)) {
		normalized.items = toOpenAIStrictSchema(schema.items);
	}

	for (const keyword of ["anyOf", "allOf"] as const) {
		const alternatives = schema[keyword];
		if (Array.isArray(alternatives)) {
			normalized[keyword] = alternatives.map((alternative) =>
				isJsonObject(alternative)
					? toOpenAIStrictSchema(alternative)
					: alternative,
			);
		}
	}

	if (Array.isArray(schema.oneOf)) {
		normalized.anyOf = schema.oneOf.map((alternative) =>
			isJsonObject(alternative)
				? toOpenAIStrictSchema(alternative)
				: alternative,
		);
		delete normalized.oneOf;
	}

	for (const keyword of ["$defs", "definitions"] as const) {
		const definitions = schema[keyword];
		if (!isJsonObject(definitions)) continue;

		normalized[keyword] = Object.fromEntries(
			Object.entries(definitions).map(([name, definition]) => [
				name,
				isJsonObject(definition)
					? toOpenAIStrictSchema(definition)
					: definition,
			]),
		);
	}

	return normalized;
}

function omitNullProperties(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(omitNullProperties);
	if (typeof value !== "object" || value === null) return value;

	return Object.fromEntries(
		Object.entries(value)
			.filter(([, property]) => property !== null)
			.map(([name, property]) => [name, omitNullProperties(property)]),
	);
}

function isUnknownObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withoutOptionalNulls<RawResponse>(
	response: CompletionResponse<RawResponse>,
	unwrapRoot: boolean,
): CompletionResponse<RawResponse> {
	return {
		...response,
		choice: response.choice.map((part) => {
			if (part.type !== "text") return part;

			try {
				const parsed: unknown = JSON.parse(part.text);
				const normalized = omitNullProperties(parsed);
				const output =
					unwrapRoot && isUnknownObject(normalized)
						? normalized.result
						: normalized;
				return {
					...part,
					text: JSON.stringify(output),
				};
			} catch {
				return part;
			}
		}),
	};
}

function toOpenAIResponseSchema(schema: JsonObject): JsonObject {
	const variants = schema.oneOf;
	if (!Array.isArray(variants)) return toOpenAIStrictSchema(schema);

	return {
		type: "object",
		properties: {
			result: {
				anyOf: variants.map((alternative) =>
					isJsonObject(alternative)
						? toOpenAIStrictSchema(alternative)
						: alternative,
				),
			},
		},
		required: ["result"],
		additionalProperties: false,
	};
}

function withOpenRouterRouting(
	request: CompletionRequest,
	strict: boolean,
): CompletionRequest {
	if (!request.outputSchema) return request;

	const existingProvider = request.providerOptions?.provider;
	return {
		...request,
		outputSchema: undefined,
		providerOptions: {
			...request.providerOptions,
			provider: {
				...(isJsonObject(existingProvider) ? existingProvider : {}),
				require_parameters: true,
			},
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "response_schema",
					strict,
					schema: strict
						? toOpenAIResponseSchema(request.outputSchema)
						: request.outputSchema,
				},
			},
		},
	};
}

/** Creates the OpenRouter completion model used by the Anvia agent runtime. */
export function createOpenRouterModel({
	apiKey,
	modelId = DEFAULT_MODEL_ID,
}: OpenRouterModelConfig): StreamingCompletionModel {
	const client = new OpenAIClient({
		apiKey,
		baseUrl: OPENROUTER_BASE_URL,
	});

	const model = client.completionModel({
		modelId,
		api: "chat",
	});

	return {
		provider: "openrouter",
		modelId: model.modelId,
		contextLimits: model.contextLimits,
		capabilities: model.capabilities,
		controls: model.controls,
		traceRequest: (request, options) =>
			model.traceRequest?.(withOpenRouterRouting(request, true), options),
		completion: async (request, options) => {
			const unwrapRoot = request.outputSchema
				? requiresRootWrapper(request.outputSchema)
				: false;
			const response = await model.completion(
				withOpenRouterRouting(request, true),
				options,
			);
			return request.outputSchema
				? withoutOptionalNulls(response, unwrapRoot)
				: response;
		},
		streamCompletion: (request, options) =>
			model.streamCompletion(withOpenRouterRouting(request, false), options),
	};
}
