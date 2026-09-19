import {
	type CompletionInput,
	CompletionInputSchema,
	type CompletionOutput,
	CompletionOutputSchema,
} from "@flemme/agent";
import { cookingSessions, type FlemmeDatabase } from "@flemme/db";
import { and, eq } from "drizzle-orm";
import { ZodError } from "zod";

import { ApiError } from "../../api-error";
import type { CookingSessionResponse } from "../cooking-session/cooking-session-schema";
import { restoreCookingSession } from "../cooking-session/cooking-session-service";
import type { CompletionRequest } from "./completion-schema";

export type CompletionRunner = (input: CompletionInput) => Promise<unknown>;

export function createCompletionService({
	db,
	completionRunner,
}: {
	db: FlemmeDatabase;
	completionRunner?: CompletionRunner;
}) {
	return {
		async generate(
			userId: string,
			sessionId: string,
			request: CompletionRequest,
		): Promise<CookingSessionResponse> {
			return db.transaction(async (transaction) => {
				const [row] = await transaction
					.select()
					.from(cookingSessions)
					.where(eq(cookingSessions.id, sessionId))
					.for("update");

				if (!row) {
					throw new ApiError(
						404,
						"COOKING_SESSION_NOT_FOUND",
						"Cooking session not found",
					);
				}

				if (row.userId !== userId) {
					throw new ApiError(
						403,
						"COOKING_SESSION_FORBIDDEN",
						"Cooking session belongs to another user",
					);
				}

				const restored = restoreCookingSession(row);
				if (
					restored.phase !== "completion" ||
					restored.session.status !== "completed"
				) {
					throw new ApiError(
						409,
						"INVALID_SESSION_STATE",
						"Only a completed cooking session can generate Completion output",
					);
				}

				if (restored.completionSnapshot) return restored;

				if (!completionRunner) {
					throw new ApiError(
						503,
						"AGENT_NOT_CONFIGURED",
						"The Completion agent is not configured",
					);
				}

				const input = CompletionInputSchema.parse({
					cookingPlan: restored.cookingPlan,
					session: restored.session,
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

				let completionSnapshot: CompletionOutput;
				try {
					completionSnapshot = CompletionOutputSchema.parse(generated);
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

				const [updated] = await transaction
					.update(cookingSessions)
					.set({
						completionSnapshot,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(cookingSessions.id, row.id),
							eq(cookingSessions.userId, userId),
						),
					)
					.returning();

				if (!updated) {
					throw new ApiError(
						500,
						"COMPLETION_PERSIST_FAILED",
						"Completion output could not be persisted",
					);
				}

				return restoreCookingSession(updated);
			});
		},
	};
}
