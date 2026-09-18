import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";
import { createCurrentUserService } from "./current-user-service";

export const CurrentUserResponseSchema = z.object({
	user: z.object({
		id: z.uuid(),
		email: z.email(),
		name: z.string(),
		image: z.string().nullable(),
	}),
});

export const UpdateCurrentUserRequestSchema = z
	.object({
		name: z.string().trim().min(1),
	})
	.strict();

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

const updateCurrentUserRouteDefinition = createRoute({
	method: "patch",
	path: "/",
	tags: ["Auth"],
	summary: "Update the authenticated Flemme user",
	description:
		"Updates the user-facing display name while email and provider image remain read-only.",
	security: [{ CurrentUser: [] }],
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: UpdateCurrentUserRequestSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Updated authenticated Flemme user",
			content: { "application/json": { schema: CurrentUserResponseSchema } },
		},
		400: {
			description: "Invalid request",
			content: { "application/json": { schema: ApiErrorResponseSchema } },
		},
		401: {
			description: "Authentication is missing or invalid",
			content: { "application/json": { schema: ApiErrorResponseSchema } },
		},
	},
});

export function createCurrentUserRoute(db: FlemmeDatabase) {
	const route = new OpenAPIHono<ApiEnvironment>({
		defaultHook: (result, context) => {
			if (!result.success) {
				return context.json(
					{
						error: {
							code: "INVALID_REQUEST",
							message: "Request validation failed",
						},
					},
					400,
				);
			}
		},
	});
	const service = createCurrentUserService(db);
	route.openapi(getCurrentUserRouteDefinition, async (context) =>
		context.json(await service.get(context.get("currentUserId")), 200),
	);
	route.openapi(updateCurrentUserRouteDefinition, async (context) =>
		context.json(
			await service.updateName(
				context.get("currentUserId"),
				context.req.valid("json").name,
			),
			200,
		),
	);
	return route;
}
