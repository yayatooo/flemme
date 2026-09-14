import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createDevelopmentAuthMiddleware } from "../auth/development-auth-middleware";
import {
	KitchenResponseSchema,
	PutKitchenRequestSchema,
} from "./kitchen-schema";
import { createKitchenService } from "./kitchen-service";

function jsonBody<TSchema extends z.ZodType>(schema: TSchema) {
	return {
		required: true,
		content: { "application/json": { schema } },
	} as const;
}

function jsonResponse<TSchema extends z.ZodType>(
	schema: TSchema,
	description: string,
) {
	return {
		description,
		content: { "application/json": { schema } },
	} as const;
}

function errorResponse(description: string) {
	return jsonResponse(ApiErrorResponseSchema, description);
}

const getKitchenRouteDefinition = createRoute({
	method: "get",
	path: "/",
	tags: ["Kitchen"],
	summary: "Get the current user's kitchen",
	description:
		"Returns the current user's persisted cooking equipment in deterministic name order.",
	security: [{ DevelopmentUser: [] }],
	responses: {
		200: jsonResponse(KitchenResponseSchema, "Current user's kitchen"),
		401: errorResponse("Development user is not authenticated"),
		404: errorResponse("Kitchen has not been created"),
		500: errorResponse("Persisted kitchen is invalid"),
	},
});

const putKitchenRouteDefinition = createRoute({
	method: "put",
	path: "/",
	tags: ["Kitchen"],
	summary: "Create or replace the current user's kitchen",
	description:
		"Atomically upserts the Kitchen and replaces its complete free-form equipment list. Empty equipment is valid.",
	security: [{ DevelopmentUser: [] }],
	request: {
		body: jsonBody(PutKitchenRequestSchema),
	},
	responses: {
		200: jsonResponse(KitchenResponseSchema, "Saved kitchen"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
		500: errorResponse("Kitchen could not be saved"),
	},
});

export function createKitchenRoute(db: FlemmeDatabase) {
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
	const service = createKitchenService(db);

	route.use("*", createDevelopmentAuthMiddleware(db));

	route.openapi(getKitchenRouteDefinition, async (context) => {
		const kitchen = await service.get(context.get("currentUserId"));
		return context.json(kitchen, 200);
	});

	route.openapi(putKitchenRouteDefinition, async (context) => {
		const kitchen = await service.put(
			context.get("currentUserId"),
			context.req.valid("json"),
		);
		return context.json(kitchen, 200);
	});

	return route;
}
