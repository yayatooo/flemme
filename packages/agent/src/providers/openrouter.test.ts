import { describe, expect, test } from "bun:test";

import { createOpenRouterModel } from "./openrouter";

describe("createOpenRouterModel", () => {
	test("uses GPT-5.6 Luna by default", () => {
		const model = createOpenRouterModel({ apiKey: "test-api-key" });

		expect(model.provider).toBe("openrouter");
		expect(model.modelId).toBe("openai/gpt-5.6-luna");
	});

	test("normalizes optional fields for OpenAI strict schema output", () => {
		const model = createOpenRouterModel({ apiKey: "test-api-key" });
		const trace = model.traceRequest?.({
			chatHistory: [{ role: "user", content: "test" }],
			documents: [],
			tools: [],
			outputSchema: { type: "object" },
		});

		expect(trace).toMatchObject({
			hasOutputSchema: false,
			providerOptionKeys: ["provider", "response_format"],
		});
	});

	test("accepts an explicit OpenRouter model slug", () => {
		const model = createOpenRouterModel({
			apiKey: "test-api-key",
			modelId: "provider/alternate-model",
		});

		expect(model.modelId).toBe("provider/alternate-model");
	});

	test("wraps and unwraps a root discriminated union for OpenAI strict output", async () => {
		const originalFetch = globalThis.fetch;
		let requestBody: unknown;
		const mockFetch = async (
			...[, init]: Parameters<typeof fetch>
		): Promise<Response> => {
			requestBody = JSON.parse(String(init?.body));
			return Response.json({
				id: "completion-test",
				object: "chat.completion",
				created: 0,
				model: "openai/gpt-5.6-luna",
				choices: [
					{
						index: 0,
						message: {
							role: "assistant",
							content: JSON.stringify({
								result: { type: "success", value: "ok", note: null },
							}),
						},
						finish_reason: "stop",
					},
				],
				usage: {
					prompt_tokens: 1,
					completion_tokens: 1,
					total_tokens: 2,
				},
			});
		};
		globalThis.fetch = Object.assign(mockFetch, {
			preconnect: originalFetch.preconnect,
		});

		try {
			const model = createOpenRouterModel({ apiKey: "test-api-key" });
			const response = await model.completion({
				chatHistory: [{ role: "user", content: "test" }],
				documents: [],
				tools: [],
				outputSchema: {
					oneOf: [
						{
							type: "object",
							properties: {
								type: { const: "success" },
								value: { type: "string" },
								note: { type: "string" },
							},
							required: ["type", "value"],
							additionalProperties: false,
						},
					],
				},
			});

			expect(requestBody).toMatchObject({
				response_format: {
					json_schema: {
						strict: true,
						schema: {
							type: "object",
							required: ["result"],
						},
					},
				},
			});
			expect(response.choice).toEqual([
				{
					type: "text",
					text: JSON.stringify({ type: "success", value: "ok" }),
				},
			]);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
