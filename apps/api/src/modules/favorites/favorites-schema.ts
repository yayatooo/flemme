import { CookingRecommendationSchema } from "@flemme/agent";
import { z } from "@hono/zod-openapi";

export const CreateFavoriteSchema = z
	.object({ cookingSessionId: z.uuid() })
	.strict();
export const FavoriteParamsSchema = z
	.object({ id: z.uuid().openapi({ param: { name: "id", in: "path" } }) })
	.strict();
export const FavoriteResponseSchema = z
	.object({
		id: z.uuid(),
		cookingSessionId: z.uuid(),
		createdAt: z.iso.datetime(),
		recipe: CookingRecommendationSchema.pick({
			name: true,
			description: true,
			servings: true,
			estimatedDuration: true,
		}),
	})
	.strict();
export const FavoritesResponseSchema = z
	.object({ items: z.array(FavoriteResponseSchema) })
	.strict();
