import { describe, expect, test } from "bun:test";

import { createOpenRouterModel } from "./openrouter";

describe("createOpenRouterModel", () => {
	test("uses DeepSeek V4.1 Flash by default", () => {
		const model = createOpenRouterModel({ apiKey: "test-api-key" });

		expect(model.modelId).toBe("deepseek/deepseek-v4.1-flash");
	});

	test("accepts an explicit OpenRouter model slug", () => {
		const model = createOpenRouterModel({
			apiKey: "test-api-key",
			modelId: "provider/alternate-model",
		});

		expect(model.modelId).toBe("provider/alternate-model");
	});
});
