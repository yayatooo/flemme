import { generateCompletion } from "@anvia/core";

import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import { createPreCookingPrompt } from "../prompts/pre-cooking";
import type { createOpenAIModel } from "../providers";
import {
	type PreCookingInput,
	PreCookingInputSchema,
} from "../schemas/pre-cooking-input";
import {
	type PreCookingOutput,
	PreCookingOutputSchema,
} from "../schemas/pre-cooking-output";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunPreCookingOptions {
	model: CookingModel;
	input: PreCookingInput;
}

/** Prepares the selected recipe for the pre-cooking phase. */
export async function runPreCooking({
	model,
	input,
}: RunPreCookingOptions): Promise<PreCookingOutput> {
	const validatedInput = PreCookingInputSchema.parse(input);
	const preCookingPrompt = createPreCookingPrompt(validatedInput);

	const prompt = `
${COOKING_INSTRUCTIONS}

${preCookingPrompt}
`.trim();

	const result = await generateCompletion({
		model,
		prompt,
		outputSchema: PreCookingOutputSchema,
	});

	return result.output;
}
