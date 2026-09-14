import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";
import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

import {
	CompleteCookingSessionRequestSchema,
	CookingSessionParamsSchema,
	CookingSessionResponseSchema,
	CreateCookingSessionRequestSchema,
	UpdateCookingProgressRequestSchema,
} from "./cooking-session-schema";
import { createCookingSessionService } from "./cooking-session-service";

function jsonBody<TSchema extends z.ZodType>(schema: TSchema) {
	return {
		required: true,
		content: {
			"application/json": { schema },
		},
	} as const;
}

function jsonResponse<TSchema extends z.ZodType>(
	schema: TSchema,
	description: string,
) {
	return {
		description,
		content: {
			"application/json": { schema },
		},
	} as const;
}

function errorResponse(description: string) {
	return jsonResponse(ApiErrorResponseSchema, description);
}

const createCookingSessionRouteDefinition = createRoute({
	method: "post",
	path: "/",
	tags: ["Cooking Sessions"],
	summary: "Create an active cooking session",
	description:
		"Persists existing Recommendation and Pre-Cooking snapshots with initial active progress. Does not invoke AI.",
	security: [{ CurrentUser: [] }],
	request: {
		body: jsonBody(CreateCookingSessionRequestSchema),
	},
	responses: {
		201: jsonResponse(CookingSessionResponseSchema, "Cooking session created"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		500: errorResponse("Cooking session could not be created"),
	},
});

const getCookingSessionRouteDefinition = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Cooking Sessions"],
	summary: "Restore a cooking session",
	description:
		"Restores owned snapshots and relational progress from PostgreSQL without invoking AI.",
	security: [{ CurrentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
	},
	responses: {
		200: jsonResponse(CookingSessionResponseSchema, "Cooking session restored"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		500: errorResponse("Persisted cooking session is invalid"),
	},
});

const updateCookingProgressRouteDefinition = createRoute({
	method: "patch",
	path: "/{id}/progress",
	tags: ["Cooking Sessions"],
	summary: "Persist active cooking progress",
	description:
		"Updates only mutable session progress after validating it against the immutable cooking plan. Does not invoke Active Cooking AI.",
	security: [{ CurrentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
		body: jsonBody(UpdateCookingProgressRequestSchema),
	},
	responses: {
		200: jsonResponse(CookingSessionResponseSchema, "Cooking progress updated"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		409: errorResponse("Cooking session state does not allow progress updates"),
		422: errorResponse("Cooking progress does not match the persisted plan"),
		500: errorResponse("Cooking progress could not be updated"),
	},
});

const completeCookingSessionRouteDefinition = createRoute({
	method: "post",
	path: "/{id}/complete",
	tags: ["Cooking Sessions"],
	summary: "Complete a cooking session",
	description:
		"Persists an already-valid Completion snapshot only after the recorded final step is completed, and atomically stores server-calculated nutrition from the persisted plan. Does not invoke AI or make a runtime USDA request.",
	security: [{ CurrentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
		body: jsonBody(CompleteCookingSessionRequestSchema),
	},
	responses: {
		200: jsonResponse(
			CookingSessionResponseSchema,
			"Cooking session completed",
		),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		409: errorResponse("Cooking session is not ready for completion"),
		500: errorResponse("Cooking session could not be completed"),
	},
});

export function createCookingSessionRoute(db: FlemmeDatabase) {
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
	const service = createCookingSessionService(db);

	route.openapi(createCookingSessionRouteDefinition, async (context) => {
		const session = await service.create(
			context.get("currentUserId"),
			context.req.valid("json"),
		);
		return context.json(session, 201);
	});

	route.openapi(getCookingSessionRouteDefinition, async (context) => {
		const session = await service.get(
			context.get("currentUserId"),
			context.req.valid("param").id,
		);
		return context.json(session, 200);
	});

	route.openapi(updateCookingProgressRouteDefinition, async (context) => {
		const session = await service.updateProgress(
			context.get("currentUserId"),
			context.req.valid("param").id,
			context.req.valid("json"),
		);
		return context.json(session, 200);
	});

	route.openapi(completeCookingSessionRouteDefinition, async (context) => {
		const session = await service.complete(
			context.get("currentUserId"),
			context.req.valid("param").id,
			context.req.valid("json"),
		);
		return context.json(session, 200);
	});

	return route;
}
