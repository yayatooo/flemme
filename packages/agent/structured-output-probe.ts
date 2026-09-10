import {
	CompletionStructuredOutputError,
	generateCompletion,
} from "@anvia/core";
import { z } from "zod";

import { createOpenAIModel } from "./src/providers";

const StructuredOutputProbeSchema = z.object({
	message: z.string(),
	count: z.number(),
});

const MODEL_IDS = [
	"glm-5.3-flash",
	"deepseek-v4-flash-0731",
	"gpt-5.6-luna",
] as const;

function getRequiredEnvironmentVariable(name: "BASE_URL" | "MUX_API_KEY") {
	const value = Bun.env[name];

	if (!value) {
		throw new Error(`${name} is missing`);
	}

	return value;
}

const apiKey = getRequiredEnvironmentVariable("MUX_API_KEY");
const baseUrl = getRequiredEnvironmentVariable("BASE_URL");

for (const modelId of MODEL_IDS) {
	const model = createOpenAIModel({ apiKey, baseUrl, modelId });

	try {
		const result = await generateCompletion({
			model,
			prompt:
				"Provide a short message and a numeric count for this compatibility probe.",
			outputSchema: StructuredOutputProbeSchema,
		});

		console.log({
			modelId,
			requestSucceeded: true,
			structuredOutputParsed: true,
			failurePhase: null,
			plainConversationalText: false,
			output: result.output,
		});
	} catch (error) {
		if (error instanceof CompletionStructuredOutputError) {
			const causeMessage =
				error.cause instanceof Error ? error.cause.message : undefined;
			const plainConversationalText =
				error.phase !== "parse"
					? false
					: causeMessage?.includes("Unexpected identifier")
						? "likely"
						: "undetermined";

			console.log({
				modelId,
				requestSucceeded: true,
				structuredOutputParsed: false,
				failurePhase: error.phase,
				plainConversationalText,
				failure: error.message,
				cause: causeMessage,
			});
			continue;
		}

		console.log({
			modelId,
			requestSucceeded: false,
			structuredOutputParsed: false,
			failurePhase: null,
			plainConversationalText: "undetermined",
			failure: error instanceof Error ? error.message : String(error),
		});
	}
}
