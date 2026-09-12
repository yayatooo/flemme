import { generateCompletion } from "@anvia/core";
import { createActiveCookingPrompt } from "../prompts/active-cooking";
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import type { createOpenAIModel } from "../providers";
import {
	type ActiveCookingInput,
	ActiveCookingInputSchema,
} from "../schemas/active-cooking-input";
import {
	type ActiveCookingOutput,
	ActiveCookingOutputSchema,
} from "../schemas/active-cooking-output";

type CookingModel = ReturnType<typeof createOpenAIModel>;

interface RunActiveCookingOptions {
	model: CookingModel;
	input: ActiveCookingInput;
}

/** Proposes the next response and actions for an existing cooking session. */
export async function runActiveCooking({
	model,
	input,
}: RunActiveCookingOptions): Promise<ActiveCookingOutput> {
	const validatedInput = ActiveCookingInputSchema.parse(input);
	const activeCookingPrompt = createActiveCookingPrompt(validatedInput);

	const prompt = `
${COOKING_INSTRUCTIONS}

${activeCookingPrompt}
`.trim();

	const result = await generateCompletion({
		model,
		prompt,
		outputSchema: ActiveCookingOutputSchema,
	});

	return result.output;
}
