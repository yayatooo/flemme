import { cookingSessions, type FlemmeDatabase, favorites } from "@flemme/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { ApiError } from "../../api-error";
import type { CookingSessionResponse } from "../cooking-session/cooking-session-schema";
import {
	createCookingSessionService,
	restoreCookingSession,
} from "../cooking-session/cooking-session-service";
import { projectMealNutritionSummary } from "../cooking-session/persisted-meal-summary";
import {
	type FavoriteListQuery,
	type FavoriteResponse,
	FavoriteResponseSchema,
	type FavoritesResponse,
	FavoritesResponseSchema,
} from "./favorites-schema";

function project(
	row: typeof favorites.$inferSelect,
	session: CookingSessionResponse,
): FavoriteResponse {
	if (session.session.status !== "completed" || !session.completedAt) {
		throw new ApiError(
			500,
			"INVALID_PERSISTED_FAVORITE",
			"Favorite references an invalid completed session",
		);
	}
	const { name, description, servings, estimatedDuration } =
		session.selectedRecipeSnapshot;
	return FavoriteResponseSchema.parse({
		id: row.id,
		cookingSessionId: row.cookingSessionId,
		createdAt: row.createdAt.toISOString(),
		displayName: session.customName ?? name,
		completedAt: session.completedAt,
		completionSummary: session.completionSnapshot?.summary ?? null,
		nutrition: projectMealNutritionSummary(session.nutritionSnapshot),
		recipe: { name, description, servings, estimatedDuration },
	});
}

export function createFavoritesService(db: FlemmeDatabase) {
	return {
		async list(
			userId: string,
			{ limit, offset, cookingSessionId }: FavoriteListQuery,
		): Promise<FavoritesResponse> {
			const rows = await db
				.select({ favorite: favorites, session: cookingSessions })
				.from(favorites)
				.innerJoin(
					cookingSessions,
					and(
						eq(favorites.cookingSessionId, cookingSessions.id),
						eq(favorites.userId, cookingSessions.userId),
					),
				)
				.where(
					and(
						eq(favorites.userId, userId),
						cookingSessionId
							? eq(favorites.cookingSessionId, cookingSessionId)
							: undefined,
					),
				)
				.orderBy(desc(favorites.createdAt), desc(favorites.id))
				.limit(limit + 1)
				.offset(offset);
			const hasMore = rows.length > limit;
			return FavoritesResponseSchema.parse({
				items: rows
					.slice(0, limit)
					.map(({ favorite, session }) =>
						project(favorite, restoreCookingSession(session)),
					),
				nextOffset: hasMore ? offset + limit : null,
			});
		},
		async create(userId: string, cookingSessionId: string) {
			// Reuse the same ownership and persisted-snapshot validation as session GET.
			const session = await createCookingSessionService(db).get(
				userId,
				cookingSessionId,
			);
			if (session.session.status !== "completed")
				throw new ApiError(
					409,
					"COOKING_SESSION_NOT_COMPLETED",
					"Only completed cooking sessions can be favorited",
				);
			// Completed snapshots are immutable through the API; recheck owner/status at insert.
			const [row] = await db
				.insert(favorites)
				.select(
					db
						.select({
							id: sql<string>`gen_random_uuid()`.as("id"),
							userId: cookingSessions.userId,
							cookingSessionId: cookingSessions.id,
							createdAt: sql<Date>`now()`.as("created_at"),
						})
						.from(cookingSessions)
						.where(
							and(
								eq(cookingSessions.id, cookingSessionId),
								eq(cookingSessions.userId, userId),
								eq(cookingSessions.status, "completed"),
							),
						),
				)
				.onConflictDoNothing({
					target: [favorites.userId, favorites.cookingSessionId],
				})
				.returning();
			if (!row)
				throw new ApiError(
					409,
					"FAVORITE_ALREADY_EXISTS",
					"Favorite already exists or session is no longer eligible",
				);
			return project(row, session);
		},
		async delete(userId: string, id: string) {
			const [row] = await db
				.select()
				.from(favorites)
				.where(eq(favorites.id, id));
			if (!row)
				throw new ApiError(404, "FAVORITE_NOT_FOUND", "Favorite not found");
			if (row.userId !== userId)
				throw new ApiError(
					403,
					"FAVORITE_FORBIDDEN",
					"Favorite belongs to another user",
				);
			const deleted = await db
				.delete(favorites)
				.where(and(eq(favorites.id, id), eq(favorites.userId, userId)))
				.returning({ id: favorites.id });
			if (!deleted.length)
				throw new ApiError(404, "FAVORITE_NOT_FOUND", "Favorite not found");
		},
	};
}
