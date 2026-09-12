import { generateCompletion } from "@anvia/core";
import { createCompletionPrompt } from "../prompts/completion";
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import type { createOpenAIModel } from "../providers";
import {
	type CompletionInput,
	CompletionInputSchema,
} from "../schemas/completion-input";
import {
	type CompletionOutput,
	CompletionOutputSchema,
} from "../schemas/completion-output";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunCompletionOptions {
	model: CookingModel;
	input: CompletionInput;
}

/** Closes an already completed cooking session without application side effects. */
export async function runCompletion({
	model,
	input,
}: RunCompletionOptions): Promise<CompletionOutput> {
	const validatedInput = CompletionInputSchema.parse(input);
	const completionPrompt = createCompletionPrompt(validatedInput);

	const prompt = `
${COOKING_INSTRUCTIONS}

${completionPrompt}
`.trim();

	const result = await generateCompletion({
		model,
		prompt,
		outputSchema: CompletionOutputSchema,
	});

	return result.output;
}
