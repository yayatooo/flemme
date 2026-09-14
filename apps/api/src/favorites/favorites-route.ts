import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";
import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createDevelopmentAuthMiddleware } from "../auth/development-auth-middleware";
import {
	CreateFavoriteSchema,
	FavoriteParamsSchema,
	FavoriteResponseSchema,
	FavoritesResponseSchema,
} from "./favorites-schema";
import { createFavoritesService } from "./favorites-service";

const response = (schema: z.ZodType, description: string) => ({
	description,
	content: { "application/json": { schema } },
});
const errors = {
	400: response(ApiErrorResponseSchema, "Invalid request"),
	401: response(ApiErrorResponseSchema, "Unauthenticated"),
	403: response(ApiErrorResponseSchema, "Another user's resource"),
	404: response(ApiErrorResponseSchema, "Resource not found"),
	409: response(
		ApiErrorResponseSchema,
		"Duplicate favorite or incomplete session",
	),
	500: response(
		ApiErrorResponseSchema,
		"Invalid persisted state or internal error",
	),
};
const common = { tags: ["Favorites"], security: [{ DevelopmentUser: [] }] };
export function createFavoritesRoute(db: FlemmeDatabase) {
	const route = new OpenAPIHono<ApiEnvironment>({
		defaultHook: (result, c) => {
			if (!result.success)
				return c.json(
					{
						error: {
							code: "INVALID_REQUEST",
							message: "Request validation failed",
						},
					},
					400,
				);
		},
	});
	const service = createFavoritesService(db);
	route.use("*", createDevelopmentAuthMiddleware(db));
	route.openapi(
		createRoute({
			...common,
			method: "get",
			path: "/",
			summary: "List historical favorites",
			responses: {
				200: response(FavoritesResponseSchema, "Favorites newest first"),
				...errors,
			},
		}),
		async (c) => c.json(await service.list(c.get("currentUserId")), 200),
	);
	route.openapi(
		createRoute({
			...common,
			method: "post",
			path: "/",
			summary: "Favorite an owned completed cooking session",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: CreateFavoriteSchema } },
				},
			},
			responses: {
				201: response(FavoriteResponseSchema, "Favorite created"),
				...errors,
			},
		}),
		async (c) =>
			c.json(
				await service.create(
					c.get("currentUserId"),
					c.req.valid("json").cookingSessionId,
				),
				201,
			),
	);
	route.openapi(
		createRoute({
			...common,
			method: "delete",
			path: "/{id}",
			summary: "Remove favorite without deleting cooking history",
			request: { params: FavoriteParamsSchema },
			responses: { 204: { description: "Favorite removed" }, ...errors },
		}),
		async (c) => {
			await service.delete(c.get("currentUserId"), c.req.valid("param").id);
			return c.body(null, 204);
		},
	);
	return route;
}
