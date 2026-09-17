import {
	ActiveCookingPlanSessionSchema,
	CompletionInputSchema,
	CompletionOutputSchema,
	CookingRecommendationOutputSchema,
	CookingRecommendationSchema,
	PreCookingOutputSchema,
} from "@flemme/agent";
import { cookingSessions, type FlemmeDatabase } from "@flemme/db";
import { RecipeNutritionResultSchema } from "@flemme/nutrition";
import { and, eq } from "drizzle-orm";

import { ApiError } from "../../api-error";
import { calculateCookingSessionNutrition } from "../nutrition/cooking-session-nutrition-service";
import {
	type CompleteCookingSessionRequest,
	type CookingSessionResponse,
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
	type UpdateCookingProgressRequest,
	type UpdateCookingSessionRequest,
} from "./cooking-session-schema";

type CookingSessionRow = typeof cookingSessions.$inferSelect;

async function findOwnedCookingSession(
	db: FlemmeDatabase,
	userId: string,
	sessionId: string,
): Promise<CookingSessionRow> {
	const [session] = await db
		.select()
		.from(cookingSessions)
		.where(eq(cookingSessions.id, sessionId));

	if (!session) {
		throw new ApiError(
			404,
			"COOKING_SESSION_NOT_FOUND",
			"Cooking session not found",
		);
	}

	if (session.userId !== userId) {
		throw new ApiError(
			403,
			"COOKING_SESSION_FORBIDDEN",
			"Cooking session belongs to another user",
		);
	}

	return session;
}

export function restoreCookingSession(
	row: CookingSessionRow,
): CookingSessionResponse {
	try {
		const recommendationSnapshot = CookingRecommendationOutputSchema.parse(
			row.recommendationSnapshot,
		);
		const selectedRecipeSnapshot = CookingRecommendationSchema.parse(
			row.selectedRecipeSnapshot,
		);
		const cookingPlan = PreCookingOutputSchema.parse(
			row.preCookingPlanSnapshot,
		);
		const sessionInput = {
			status: row.status,
			currentStageId: row.currentStageId,
			currentStepId: row.currentStepId,
			completedStepIds: row.completedStepIds,
			changes: row.changes,
			...(row.status === "paused" ? { pauseReason: row.pauseReason } : {}),
		};
		const session = ActiveCookingPlanSessionSchema.parse({
			cookingPlan,
			session: sessionInput,
		}).session;
		const completionSnapshot = row.completionSnapshot
			? CompletionOutputSchema.parse(row.completionSnapshot)
			: null;
		const nutritionSnapshot = row.nutritionSnapshot
			? RecipeNutritionResultSchema.parse(row.nutritionSnapshot)
			: null;

		return CookingSessionResponseSchema.parse({
			id: row.id,
			customName: row.customName,
			phase: row.phase,
			session,
			recommendationSnapshot,
			selectedRecipeSnapshot,
			cookingPlan,
			completionSnapshot,
			nutritionSnapshot,
			startedAt: row.startedAt.toISOString(),
			completedAt: row.completedAt?.toISOString() ?? null,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		});
	} catch {
		throw new ApiError(
			500,
			"INVALID_PERSISTED_SNAPSHOT",
			"Cooking session contains invalid persisted data",
		);
	}
}

function assertFinalCookingStepCompleted(
	session: Pick<CookingSessionResponse, "cookingPlan" | "session">,
) {
	const finalStage = session.cookingPlan.cookingStages.at(-1);
	const finalStep = finalStage?.steps.at(-1);

	if (
		!finalStage ||
		!finalStep ||
		session.session.currentStageId !== finalStage.id ||
		session.session.currentStepId !== finalStep.id ||
		!session.session.completedStepIds.includes(finalStep.id)
	) {
		throw new ApiError(
			409,
			"SESSION_NOT_READY_FOR_COMPLETION",
			"The final cooking step must be completed first",
		);
	}
}

export function assertCookingSessionCompletionReady(
	session: CookingSessionResponse,
) {
	if (
		session.phase !== "active_cooking" ||
		session.session.status !== "active"
	) {
		throw new ApiError(
			409,
			"INVALID_SESSION_STATE",
			"Only an active cooking session can be completed",
		);
	}
	assertFinalCookingStepCompleted(session);
}

export function createCookingSessionService(db: FlemmeDatabase) {
	return {
		async create(
			userId: string,
			input: CreateCookingSessionRequest,
		): Promise<CookingSessionResponse> {
			const [created] = await db
				.insert(cookingSessions)
				.values({
					userId,
					phase: "active_cooking",
					status: "active",
					recommendationSnapshot: input.recommendationSnapshot,
					selectedRecipeSnapshot: input.selectedRecipeSnapshot,
					preCookingPlanSnapshot: input.cookingPlan,
					currentStageId: input.session.currentStageId,
					currentStepId: input.session.currentStepId,
					completedStepIds: input.session.completedStepIds,
					changes: input.session.changes,
				})
				.returning();

			if (!created) {
				throw new ApiError(
					500,
					"COOKING_SESSION_CREATE_FAILED",
					"Cooking session could not be created",
				);
			}

			return restoreCookingSession(created);
		},

		async get(
			userId: string,
			sessionId: string,
		): Promise<CookingSessionResponse> {
			const session = await findOwnedCookingSession(db, userId, sessionId);
			return restoreCookingSession(session);
		},

		async update(
			userId: string,
			sessionId: string,
			input: UpdateCookingSessionRequest,
		): Promise<CookingSessionResponse> {
			const row = await findOwnedCookingSession(db, userId, sessionId);
			const [updated] = await db
				.update(cookingSessions)
				.set({
					customName: input.customName,
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
					"COOKING_SESSION_UPDATE_FAILED",
					"Cooking session could not be renamed",
				);
			}

			return restoreCookingSession(updated);
		},

		async updateProgress(
			userId: string,
			sessionId: string,
			input: UpdateCookingProgressRequest,
		): Promise<CookingSessionResponse> {
			const row = await findOwnedCookingSession(db, userId, sessionId);

			if (
				row.phase !== "active_cooking" ||
				(row.status !== "active" && row.status !== "paused")
			) {
				throw new ApiError(
					409,
					"INVALID_SESSION_STATE",
					"Cooking progress cannot be updated in the current state",
				);
			}

			if (
				input.session.status !== "active" &&
				input.session.status !== "paused" &&
				input.session.status !== "completed" &&
				input.session.status !== "abandoned"
			) {
				throw new ApiError(
					422,
					"INVALID_PROGRESS_TRANSITION",
					"Progress updates may only activate, pause, complete, or abandon a cooking session",
				);
			}

			if (input.session.status === "completed" && row.status !== "active") {
				throw new ApiError(
					409,
					"INVALID_SESSION_STATE",
					"Only active cooking can be completed",
				);
			}

			let validatedPlan: CookingSessionResponse["cookingPlan"];
			let validatedProgress: UpdateCookingProgressRequest["session"];

			try {
				validatedPlan = PreCookingOutputSchema.parse(
					row.preCookingPlanSnapshot,
				);
				validatedProgress = ActiveCookingPlanSessionSchema.parse({
					cookingPlan: validatedPlan,
					session: input.session,
				}).session;
			} catch {
				throw new ApiError(
					422,
					"INVALID_COOKING_PROGRESS",
					"Cooking progress does not match the persisted cooking plan",
				);
			}

			const isCompleting = validatedProgress.status === "completed";
			if (isCompleting) {
				assertFinalCookingStepCompleted({
					cookingPlan: validatedPlan,
					session: validatedProgress,
				});
			}

			const updatedAt = new Date();
			const [updated] = await db
				.update(cookingSessions)
				.set({
					phase: isCompleting ? "completion" : row.phase,
					status: validatedProgress.status,
					pauseReason:
						validatedProgress.status === "paused"
							? validatedProgress.pauseReason
							: null,
					currentStageId: validatedProgress.currentStageId,
					currentStepId: validatedProgress.currentStepId,
					completedStepIds: validatedProgress.completedStepIds,
					changes: validatedProgress.changes,
					completedAt: isCompleting ? updatedAt : row.completedAt,
					updatedAt,
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
					"COOKING_PROGRESS_UPDATE_FAILED",
					"Cooking progress could not be updated",
				);
			}

			return restoreCookingSession(updated);
		},

		async complete(
			userId: string,
			sessionId: string,
			input: CompleteCookingSessionRequest,
		): Promise<CookingSessionResponse> {
			const row = await findOwnedCookingSession(db, userId, sessionId);
			const restored = restoreCookingSession(row);
			assertCookingSessionCompletionReady(restored);

			const completedSession = {
				status: "completed" as const,
				currentStageId: restored.session.currentStageId,
				currentStepId: restored.session.currentStepId,
				completedStepIds: restored.session.completedStepIds,
				changes: restored.session.changes,
			};

			CompletionInputSchema.parse({
				cookingPlan: restored.cookingPlan,
				session: completedSession,
			});
			const nutritionSnapshot = calculateCookingSessionNutrition({
				cookingPlan: restored.cookingPlan,
				servings: restored.selectedRecipeSnapshot.servings,
				changes: restored.session.changes,
			});

			const completedAt = new Date();
			const [completed] = await db
				.update(cookingSessions)
				.set({
					phase: "completion",
					status: "completed",
					pauseReason: null,
					completionSnapshot: input.completionSnapshot,
					nutritionSnapshot,
					completedAt,
					updatedAt: completedAt,
				})
				.where(
					and(
						eq(cookingSessions.id, row.id),
						eq(cookingSessions.userId, userId),
					),
				)
				.returning();

			if (!completed) {
				throw new ApiError(
					500,
					"COOKING_SESSION_COMPLETE_FAILED",
					"Cooking session could not be completed",
				);
			}

			return restoreCookingSession(completed);
		},
	};
}
