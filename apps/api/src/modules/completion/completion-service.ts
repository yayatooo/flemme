import {
	type CompletionInput,
	CompletionInputSchema,
	type CompletionOutput,
	CompletionOutputSchema,
} from "@flemme/agent";
import type { FlemmeDatabase } from "@flemme/db";
import { ZodError } from "zod";

import { ApiError } from "../../api-error";
import {
	assertCookingSessionCompletionReady,
	createCookingSessionService,
} from "../cooking-session/cooking-session-service";
import type { CompletionRequest } from "./completion-schema";

export type CompletionRunner = (input: CompletionInput) => Promise<unknown>;

export function createCompletionService({
	db,
	completionRunner,
}: {
	db: FlemmeDatabase;
	completionRunner?: CompletionRunner;
}) {
	const cookingSessions = createCookingSessionService(db);

	return {
		async generate(
			userId: string,
			sessionId: string,
			request: CompletionRequest,
		): Promise<CompletionOutput> {
			const restored = await cookingSessions.get(userId, sessionId);
			assertCookingSessionCompletionReady(restored);

			if (!completionRunner) {
				throw new ApiError(
					503,
					"AGENT_NOT_CONFIGURED",
					"The Completion agent is not configured",
				);
			}

			const input = CompletionInputSchema.parse({
				cookingPlan: restored.cookingPlan,
				session: {
					status: "completed",
					currentStageId: restored.session.currentStageId,
					currentStepId: restored.session.currentStepId,
					completedStepIds: restored.session.completedStepIds,
					changes: restored.session.changes,
				},
				...(request.message ? { message: request.message } : {}),
			});
			let generated: unknown;

			try {
				generated = await completionRunner(input);
			} catch {
				throw new ApiError(
					502,
					"COMPLETION_GENERATION_FAILED",
					"The Completion agent could not generate a response",
				);
			}

			try {
				return CompletionOutputSchema.parse(generated);
			} catch (error) {
				if (error instanceof ZodError) {
					throw new ApiError(
						502,
						"INVALID_AGENT_OUTPUT",
						"The Completion agent returned an invalid response",
					);
				}

				throw error;
			}
		},
	};
}
