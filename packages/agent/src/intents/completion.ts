import { type CompletionModel, generateCompletion } from "@anvia/core";
import {
	observeRuntimeExecution,
	type RuntimeTraceObserver,
} from "../observability/recommendation-observability";
import { createCompletionPrompt } from "../prompts/completion";
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import {
	type CompletionInput,
	CompletionInputSchema,
} from "../schemas/completion-input";
import {
	type CompletionOutput,
	CompletionOutputSchema,
} from "../schemas/completion-output";

interface RunCompletionOptions {
	model: CompletionModel;
	input: CompletionInput;
	observability?: RuntimeTraceObserver;
}

/** Closes an already completed cooking session without application side effects. */
export async function runCompletion({
	model,
	input,
	observability,
}: RunCompletionOptions): Promise<CompletionOutput> {
	return observeRuntimeExecution({
		phase: "completion",
		modelIdentifier: model.modelId,
		observability,
		execute: async () => {
			const validatedInput = CompletionInputSchema.parse(input);
			const completionPrompt = createCompletionPrompt(validatedInput);

			const prompt = `
${COOKING_INSTRUCTIONS}

${completionPrompt}
`.trim();

			const modelStartedAt = performance.now();
			const result = await generateCompletion({
				model,
				prompt,
				outputSchema: CompletionOutputSchema,
			});

			return {
				output: result.output,
				resultVariant: "completion" as const,
				executionPath: "model" as const,
				modelDurationMs: performance.now() - modelStartedAt,
				inputTokens: result.usage.inputTokens,
				outputTokens: result.usage.outputTokens,
			};
		},
	});
}
