import { cookingSessions, type FlemmeDatabase, favorites } from "@flemme/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { ApiError } from "../../api-error";
import type { CookingSessionResponse } from "../cooking-session/cooking-session-schema";
import {
	createCookingSessionService,
	restoreCookingSession,
} from "../cooking-session/cooking-session-service";
import { FavoriteResponseSchema } from "./favorites-schema";

function project(
	row: typeof favorites.$inferSelect,
	session: CookingSessionResponse,
) {
	if (session.session.status !== "completed")
		throw new ApiError(
			500,
			"INVALID_PERSISTED_FAVORITE",
			"Favorite references an incomplete session",
		);
	const { name, description, servings, estimatedDuration } =
		session.selectedRecipeSnapshot;
	return FavoriteResponseSchema.parse({
		id: row.id,
		cookingSessionId: row.cookingSessionId,
		createdAt: row.createdAt.toISOString(),
		recipe: { name, description, servings, estimatedDuration },
	});
}

export function createFavoritesService(db: FlemmeDatabase) {
	return {
		async list(userId: string) {
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
				.where(eq(favorites.userId, userId))
				.orderBy(desc(favorites.createdAt), desc(favorites.id));
			return {
				items: rows.map(({ favorite, session }) =>
					project(favorite, restoreCookingSession(session)),
				),
			};
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
