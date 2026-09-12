import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createDevelopmentAuthMiddleware } from "../auth/development-auth-middleware";
import {
	CompleteCookingSessionRequestSchema,
	CookingSessionParamsSchema,
	CookingSessionResponseSchema,
	CreateCookingSessionRequestSchema,
	UpdateCookingProgressRequestSchema,
} from "./cooking-session-schema";
import { createCookingSessionService } from "./cooking-session-service";

const DevelopmentAuthHeadersSchema = z.object({
	"x-flemme-user-id": z
		.string()
		.uuid()
		.openapi({
			param: {
				name: "x-flemme-user-id",
				in: "header",
			},
			description: "Development-only UUID of an existing Flemme user",
			example: "00000000-0000-4000-8000-000000000000",
		}),
});

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
	request: {
		headers: DevelopmentAuthHeadersSchema,
		body: jsonBody(CreateCookingSessionRequestSchema),
	},
	responses: {
		201: jsonResponse(CookingSessionResponseSchema, "Cooking session created"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
		500: errorResponse("Cooking session could not be created"),
	},
});

const getCookingSessionRouteDefinition = createRoute({
	method: "get",
	path: "/{id}",
	tags: ["Cooking Sessions"],
	request: {
		headers: DevelopmentAuthHeadersSchema,
		params: CookingSessionParamsSchema,
	},
	responses: {
		200: jsonResponse(CookingSessionResponseSchema, "Cooking session restored"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		500: errorResponse("Persisted cooking session is invalid"),
	},
});

const updateCookingProgressRouteDefinition = createRoute({
	method: "patch",
	path: "/{id}/progress",
	tags: ["Cooking Sessions"],
	request: {
		headers: DevelopmentAuthHeadersSchema,
		params: CookingSessionParamsSchema,
		body: jsonBody(UpdateCookingProgressRequestSchema),
	},
	responses: {
		200: jsonResponse(CookingSessionResponseSchema, "Cooking progress updated"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
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
	request: {
		headers: DevelopmentAuthHeadersSchema,
		params: CookingSessionParamsSchema,
		body: jsonBody(CompleteCookingSessionRequestSchema),
	},
	responses: {
		200: jsonResponse(
			CookingSessionResponseSchema,
			"Cooking session completed",
		),
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
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

	route.use("*", createDevelopmentAuthMiddleware(db));

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
