import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

import {
	ProfileResponseSchema,
	PutProfileRequestSchema,
} from "./profile-schema";
import { createProfileService } from "./profile-service";

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

const getProfileRouteDefinition = createRoute({
	method: "get",
	path: "/",
	tags: ["Profile"],
	summary: "Get the current user's cooking profile",
	description:
		"Returns the persistent food and cooking preferences used by cooking-context orchestration.",
	security: [{ CurrentUser: [] }],
	responses: {
		200: jsonResponse(ProfileResponseSchema, "Current user's cooking profile"),
		401: errorResponse("Authentication is required"),
		404: errorResponse("Profile has not been created"),
		500: errorResponse("Persisted profile is invalid"),
	},
});

const putProfileRouteDefinition = createRoute({
	method: "put",
	path: "/",
	tags: ["Profile"],
	summary: "Create or replace the current user's cooking profile",
	description:
		"Upserts the profile and replaces both preference arrays as complete values. Empty arrays are valid.",
	security: [{ CurrentUser: [] }],
	request: {
		body: jsonBody(PutProfileRequestSchema),
	},
	responses: {
		200: jsonResponse(ProfileResponseSchema, "Saved cooking profile"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		500: errorResponse("Profile could not be saved"),
	},
});

export function createProfileRoute(db: FlemmeDatabase) {
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
	const service = createProfileService(db);

	route.openapi(getProfileRouteDefinition, async (context) => {
		const profile = await service.get(context.get("currentUserId"));
		return context.json(profile, 200);
	});

	route.openapi(putProfileRouteDefinition, async (context) => {
		const profile = await service.put(
			context.get("currentUserId"),
			context.req.valid("json"),
		);
		return context.json(profile, 200);
	});

	return route;
}
