import {
	CreateFavoriteSchema,
	FAVORITES_MAX_PAGE_SIZE,
	FAVORITES_PAGE_SIZE,
	type FavoriteResponse,
	FavoriteResponseSchema,
	type FavoritesResponse,
	FavoritesResponseSchema,
} from "@flemme/contracts/favorite";
import { z } from "@hono/zod-openapi";

export const FavoriteListQuerySchema = z
	.object({
		limit: z.coerce
			.number()
			.int()
			.min(1)
			.max(FAVORITES_MAX_PAGE_SIZE)
			.default(FAVORITES_PAGE_SIZE),
		offset: z.coerce.number().int().nonnegative().default(0),
		cookingSessionId: z.uuid().optional(),
	})
	.strict();

export type FavoriteListQuery = z.infer<typeof FavoriteListQuerySchema>;
export type { FavoriteResponse, FavoritesResponse };

export {
	CreateFavoriteSchema,
	FavoriteResponseSchema,
	FavoritesResponseSchema,
};

export const FavoriteParamsSchema = z
	.object({ id: z.uuid().openapi({ param: { name: "id", in: "path" } }) })
	.strict();
