import {
	type PreCookingInput,
	PreCookingInputSchema,
	type PreCookingOutput,
	PreCookingOutputSchema,
} from "@flemme/agent";
import type { FlemmeDatabase } from "@flemme/db";
import { ZodError } from "zod";

import { ApiError } from "../api-error";
import { createCookingContextService } from "../cooking/cooking-context-service";
import type { PreCookingRequest } from "./pre-cooking-schema";

export type PreCookingRunner = (input: PreCookingInput) => Promise<unknown>;

export function createPreCookingService({
	db,
	preCookingRunner,
}: {
	db: FlemmeDatabase;
	preCookingRunner?: PreCookingRunner;
}) {
	const cookingContext = createCookingContextService(db);

	return {
		async generate(
			userId: string,
			request: PreCookingRequest,
		): Promise<PreCookingOutput> {
			if (!preCookingRunner) {
				throw new ApiError(
					503,
					"AGENT_NOT_CONFIGURED",
					"The pre-cooking agent is not configured",
				);
			}

			const { selectedRecipe, ...contextRequest } = request;
			const context = await cookingContext.build(userId, contextRequest);
			const input = PreCookingInputSchema.parse({ selectedRecipe, context });
			let generated: unknown;

			try {
				generated = await preCookingRunner(input);
			} catch {
				throw new ApiError(
					502,
					"PRE_COOKING_GENERATION_FAILED",
					"The pre-cooking agent could not generate a response",
				);
			}

			try {
				return PreCookingOutputSchema.parse(generated);
			} catch (error) {
				if (error instanceof ZodError) {
					throw new ApiError(
						502,
						"INVALID_AGENT_OUTPUT",
						"The pre-cooking agent returned an invalid response",
					);
				}

				throw error;
			}
		},
	};
}
