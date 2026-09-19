import { type CompletionModel, generateCompletion } from "@anvia/core";
import {
	observeRuntimeExecution,
	type RuntimeTraceObserver,
} from "../observability/recommendation-observability";
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import { createPreCookingPrompt } from "../prompts/pre-cooking";
import {
	type PreCookingInput,
	PreCookingInputSchema,
} from "../schemas/pre-cooking-input";
import {
	type PreCookingOutput,
	PreCookingOutputSchema,
} from "../schemas/pre-cooking-output";

interface RunPreCookingOptions {
	model: CompletionModel;
	input: PreCookingInput;
	observability?: RuntimeTraceObserver;
}

/** Prepares the selected recipe for the pre-cooking phase. */
export async function runPreCooking({
	model,
	input,
	observability,
}: RunPreCookingOptions): Promise<PreCookingOutput> {
	return observeRuntimeExecution({
		phase: "pre-cooking",
		modelIdentifier: model.modelId,
		observability,
		execute: async () => {
			const validatedInput = PreCookingInputSchema.parse(input);
			const preCookingPrompt = createPreCookingPrompt(validatedInput);

			const prompt = `
${COOKING_INSTRUCTIONS}

${preCookingPrompt}
`.trim();

			const modelStartedAt = performance.now();
			const result = await generateCompletion({
				model,
				prompt,
				outputSchema: PreCookingOutputSchema,
			});

			return {
				output: result.output,
				resultVariant: "cooking_plan" as const,
				executionPath: "model" as const,
				modelDurationMs: performance.now() - modelStartedAt,
				inputTokens: result.usage.inputTokens,
				outputTokens: result.usage.outputTokens,
			};
		},
	});
}
