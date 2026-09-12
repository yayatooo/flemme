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

import { ApiError } from "../api-error";
import {
	type CompleteCookingSessionRequest,
	type CookingSessionResponse,
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
	type UpdateCookingProgressRequest,
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

function restoreCookingSession(row: CookingSessionRow): CookingSessionResponse {
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

		if (row.status === "completed" && !completionSnapshot) {
			throw new Error("Completed session is missing its completion snapshot");
		}

		return CookingSessionResponseSchema.parse({
			id: row.id,
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
					nutritionSnapshot: input.nutritionSnapshot,
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
				input.session.status !== "paused"
			) {
				throw new ApiError(
					422,
					"INVALID_PROGRESS_TRANSITION",
					"Progress updates may only activate or pause a cooking session",
				);
			}

			let validatedProgress: UpdateCookingProgressRequest["session"];

			try {
				const cookingPlan = PreCookingOutputSchema.parse(
					row.preCookingPlanSnapshot,
				);
				validatedProgress = ActiveCookingPlanSessionSchema.parse({
					cookingPlan,
					session: input.session,
				}).session;
			} catch {
				throw new ApiError(
					422,
					"INVALID_COOKING_PROGRESS",
					"Cooking progress does not match the persisted cooking plan",
				);
			}

			const [updated] = await db
				.update(cookingSessions)
				.set({
					status: validatedProgress.status,
					pauseReason:
						validatedProgress.status === "paused"
							? validatedProgress.pauseReason
							: null,
					currentStageId: validatedProgress.currentStageId,
					currentStepId: validatedProgress.currentStepId,
					completedStepIds: validatedProgress.completedStepIds,
					changes: validatedProgress.changes,
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

			if (row.phase !== "active_cooking" || row.status !== "active") {
				throw new ApiError(
					409,
					"INVALID_SESSION_STATE",
					"Only an active cooking session can be completed",
				);
			}

			const finalStage = restored.cookingPlan.cookingStages.at(-1);
			const finalStep = finalStage?.steps.at(-1);

			if (
				!finalStage ||
				!finalStep ||
				restored.session.currentStageId !== finalStage.id ||
				restored.session.currentStepId !== finalStep.id ||
				!restored.session.completedStepIds.includes(finalStep.id)
			) {
				throw new ApiError(
					409,
					"SESSION_NOT_READY_FOR_COMPLETION",
					"The final cooking step must be completed first",
				);
			}

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

			const completedAt = new Date();
			const [completed] = await db
				.update(cookingSessions)
				.set({
					phase: "completion",
					status: "completed",
					pauseReason: null,
					completionSnapshot: input.completionSnapshot,
					nutritionSnapshot:
						input.nutritionSnapshot ?? restored.nutritionSnapshot,
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
