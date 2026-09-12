import {
	type CookingRecommendationInput,
	type CookingRecommendationOutput,
	CookingRecommendationOutputSchema,
} from "@flemme/agent";
import type { FlemmeDatabase } from "@flemme/db";
import { ZodError } from "zod";

import { ApiError } from "../api-error";
import { createCookingContextService } from "../cooking/cooking-context-service";
import type { CookingRecommendationRequest } from "./cooking-recommendation-schema";

export type CookingRecommendationRunner = (
	context: CookingRecommendationInput,
) => Promise<unknown>;

export function createCookingRecommendationService({
	db,
	recommendationRunner,
}: {
	db: FlemmeDatabase;
	recommendationRunner?: CookingRecommendationRunner;
}) {
	const cookingContext = createCookingContextService(db);

	return {
		async recommend(
			userId: string,
			request: CookingRecommendationRequest,
		): Promise<CookingRecommendationOutput> {
			if (!recommendationRunner) {
				throw new ApiError(
					503,
					"AGENT_NOT_CONFIGURED",
					"The recommendation agent is not configured",
				);
			}

			const context = await cookingContext.build(userId, request);
			let generated: unknown;

			try {
				generated = await recommendationRunner(context);
			} catch {
				throw new ApiError(
					502,
					"RECOMMENDATION_GENERATION_FAILED",
					"The recommendation agent could not generate a response",
				);
			}

			try {
				return CookingRecommendationOutputSchema.parse(generated);
			} catch (error) {
				if (error instanceof ZodError) {
					throw new ApiError(
						502,
						"INVALID_AGENT_OUTPUT",
						"The recommendation agent returned an invalid response",
					);
				}

				throw error;
			}
		},
	};
}
