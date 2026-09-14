import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createCurrentUserService } from "./current-user-service";

export const CurrentUserResponseSchema = z.object({
	user: z.object({
		id: z.uuid(),
		email: z.email(),
	}),
});

const getCurrentUserRouteDefinition = createRoute({
	method: "get",
	path: "/",
	tags: ["Auth"],
	summary: "Get the authenticated Flemme user",
	description:
		"Returns only the canonical Flemme user identity resolved by the Better Auth session.",
	security: [{ CurrentUser: [] }],
	responses: {
		200: {
			description: "Authenticated Flemme user",
			content: { "application/json": { schema: CurrentUserResponseSchema } },
		},
		401: {
			description: "Authentication is missing or invalid",
			content: { "application/json": { schema: ApiErrorResponseSchema } },
		},
	},
});

export function createCurrentUserRoute(db: FlemmeDatabase) {
	const route = new OpenAPIHono<ApiEnvironment>();
	const service = createCurrentUserService(db);
	route.openapi(getCurrentUserRouteDefinition, async (context) =>
		context.json(await service.get(context.get("currentUserId")), 200),
	);
	return route;
}
