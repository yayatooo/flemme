import {
	type ActiveCookingInput,
	ActiveCookingInputSchema,
	type ActiveCookingOutput,
	ActiveCookingOutputSchema,
} from "@flemme/agent";
import type { FlemmeDatabase } from "@flemme/db";
import { ZodError } from "zod";

import { ApiError } from "../api-error";
import { createCookingSessionService } from "../cooking-session/cooking-session-service";
import type { ActiveCookingRequest } from "./active-cooking-schema";

export type ActiveCookingRunner = (
	input: ActiveCookingInput,
) => Promise<unknown>;

export function createActiveCookingService({
	db,
	activeCookingRunner,
}: {
	db: FlemmeDatabase;
	activeCookingRunner?: ActiveCookingRunner;
}) {
	const cookingSessions = createCookingSessionService(db);

	return {
		async respond(
			userId: string,
			sessionId: string,
			request: ActiveCookingRequest,
		): Promise<ActiveCookingOutput> {
			const restored = await cookingSessions.get(userId, sessionId);

			if (
				restored.phase !== "active_cooking" ||
				(restored.session.status !== "active" &&
					restored.session.status !== "paused")
			) {
				throw new ApiError(
					409,
					"ACTIVE_COOKING_NOT_ALLOWED",
					"Active Cooking is unavailable for this session state",
				);
			}

			if (!activeCookingRunner) {
				throw new ApiError(
					503,
					"AGENT_NOT_CONFIGURED",
					"The Active Cooking agent is not configured",
				);
			}

			const input = ActiveCookingInputSchema.parse({
				cookingPlan: restored.cookingPlan,
				session: restored.session,
				message: request.message,
			});
			let generated: unknown;

			try {
				generated = await activeCookingRunner(input);
			} catch {
				throw new ApiError(
					502,
					"ACTIVE_COOKING_GENERATION_FAILED",
					"The Active Cooking agent could not generate a response",
				);
			}

			try {
				return ActiveCookingOutputSchema.parse(generated);
			} catch (error) {
				if (error instanceof ZodError) {
					throw new ApiError(
						502,
						"INVALID_AGENT_OUTPUT",
						"The Active Cooking agent returned an invalid response",
					);
				}

				throw error;
			}
		},
	};
}
