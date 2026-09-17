import { expect, test } from "bun:test";
import {
	CreateFavoriteSchema,
	FavoriteListQuerySchema,
	FavoriteParamsSchema,
	FavoritesResponseSchema,
} from "./favorites-schema";

test("strict favorite identity and empty collection contracts", () => {
	const cookingSessionId = crypto.randomUUID();
	expect(CreateFavoriteSchema.parse({ cookingSessionId })).toEqual({
		cookingSessionId,
	});
	for (const input of [
		{},
		{ cookingSessionId: "bad" },
		{ cookingSessionId, userId: cookingSessionId },
		{ cookingSessionId, recipe: {} },
	])
		expect(CreateFavoriteSchema.safeParse(input).success).toBe(false);
	expect(FavoriteParamsSchema.safeParse({ id: "bad" }).success).toBe(false);
	expect(
		FavoritesResponseSchema.parse({ items: [], nextOffset: null }),
	).toEqual({ items: [], nextOffset: null });
	expect(FavoriteListQuerySchema.parse({})).toEqual({
		limit: 10,
		offset: 0,
	});
	expect(FavoriteListQuerySchema.safeParse({ limit: 21 }).success).toBe(false);
});
