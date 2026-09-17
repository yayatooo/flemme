import { cookingSessions, type FlemmeDatabase } from "@flemme/db";
import { and, eq } from "drizzle-orm";

import { ApiError } from "../../api-error";
import type { CookingSessionResponse } from "../cooking-session/cooking-session-schema";
import { restoreCookingSession } from "../cooking-session/cooking-session-service";
import { calculateCookingSessionNutrition } from "./cooking-session-nutrition-service";

export function createNutritionService(db: FlemmeDatabase) {
	return {
		async generate(
			userId: string,
			sessionId: string,
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
					restored.session.status !== "completed" ||
					!restored.completionSnapshot
				) {
					throw new ApiError(
						409,
						"INVALID_SESSION_STATE",
						"Only a completed cooking session with Completion output can generate Nutrition",
					);
				}

				if (restored.nutritionSnapshot) return restored;

				const nutritionSnapshot = calculateCookingSessionNutrition({
					cookingPlan: restored.cookingPlan,
					servings: restored.selectedRecipeSnapshot.servings,
					changes: restored.session.changes,
				});
				const [updated] = await transaction
					.update(cookingSessions)
					.set({ nutritionSnapshot, updatedAt: new Date() })
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
						"NUTRITION_PERSIST_FAILED",
						"Nutrition snapshot could not be persisted",
					);
				}

				return restoreCookingSession(updated);
			});
		},
	};
}
