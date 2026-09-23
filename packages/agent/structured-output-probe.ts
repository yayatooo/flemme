import {
	CompletionStructuredOutputError,
	generateCompletion,
} from "@anvia/core";
import { z } from "zod";

import { createOpenRouterModel } from "./src/providers";

const StructuredOutputProbeSchema = z.object({
	message: z.string(),
	count: z.number(),
});

const MODEL_IDS = ["openai/gpt-5.6-luna"] as const;

function getRequiredOpenRouterApiKey() {
	const value = Bun.env.OPENROUTER_API_KEY ?? Bun.env.OPEN_API_KEY;

	if (!value) {
		throw new Error("OPENROUTER_API_KEY is missing");
	}

	return value;
}

const apiKey = getRequiredOpenRouterApiKey();

for (const modelId of MODEL_IDS) {
	const model = createOpenRouterModel({ apiKey, modelId });

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
