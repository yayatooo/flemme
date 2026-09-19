import { type CompletionModel, generateCompletion } from "@anvia/core";
import {
	observeRuntimeExecution,
	type RuntimeTraceObserver,
} from "../observability/recommendation-observability";
import { createActiveCookingPrompt } from "../prompts/active-cooking";
import { COOKING_INSTRUCTIONS } from "../prompts/cooking-instructions";
import {
	type ActiveCookingInput,
	ActiveCookingInputSchema,
} from "../schemas/active-cooking-input";
import {
	type ActiveCookingOutput,
	ActiveCookingOutputSchema,
} from "../schemas/active-cooking-output";
import {
	createActiveCookingScopeResponse,
	enforceActiveCookingScopeActions,
	resolveActiveCookingScope,
} from "./active-cooking-scope";

interface RunActiveCookingOptions {
	model: CompletionModel;
	input: ActiveCookingInput;
	observability?: RuntimeTraceObserver;
}

/** Proposes the next response and actions for an existing cooking session. */
export async function runActiveCooking({
	model,
	input,
	observability,
}: RunActiveCookingOptions): Promise<ActiveCookingOutput> {
	const validatedInput = ActiveCookingInputSchema.parse(input);
	const scopeDecision = resolveActiveCookingScope(validatedInput);
	const scopedResponse = createActiveCookingScopeResponse(
		scopeDecision,
		validatedInput,
	);
	if (scopedResponse) {
		return observeRuntimeExecution({
			phase: "active-cooking",
			modelIdentifier: "deterministic-local",
			observability,
			execute: async () => ({
				output: enforceActiveCookingScopeActions(
					scopeDecision.scope,
					scopedResponse,
				),
				resultVariant: "active_response" as const,
				executionPath: "local" as const,
			}),
		});
	}

	return observeRuntimeExecution({
		phase: "active-cooking",
		modelIdentifier: model.modelId,
		observability,
		execute: async () => {
			const activeCookingPrompt = createActiveCookingPrompt(validatedInput);

			const prompt = `
${COOKING_INSTRUCTIONS}

${activeCookingPrompt}
`.trim();

			const modelStartedAt = performance.now();
			const result = await generateCompletion({
				model,
				prompt,
				outputSchema: ActiveCookingOutputSchema,
			});

			return {
				output: enforceActiveCookingScopeActions(
					scopeDecision.scope,
					result.output,
				),
				resultVariant: "active_response" as const,
				executionPath: "model" as const,
				modelDurationMs: performance.now() - modelStartedAt,
				inputTokens: result.usage.inputTokens,
				outputTokens: result.usage.outputTokens,
			};
		},
	});
}
