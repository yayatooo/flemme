import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

import { CookingSessionParamsSchema } from "../cooking-session/cooking-session-schema";
import {
	ActiveCookingRequestSchema,
	ActiveCookingResponseSchema,
} from "./active-cooking-schema";
import {
	type ActiveCookingRunner,
	createActiveCookingService,
} from "./active-cooking-service";

function errorResponse(description: string) {
	return {
		description,
		content: { "application/json": { schema: ApiErrorResponseSchema } },
	} as const;
}

const activeCookingRouteDefinition = createRoute({
	method: "post",
	path: "/{id}/active-cooking",
	tags: ["Active Cooking"],
	summary: "Ask the Active Cooking Agent",
	description:
		"Restores the owned cooking plan and progress, then returns guidance and proposed actions for one message. Proposed actions are not persisted automatically.",
	security: [{ CurrentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": { schema: ActiveCookingRequestSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Validated guidance and proposed actions",
			content: {
				"application/json": { schema: ActiveCookingResponseSchema },
			},
		},
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		409: errorResponse("Cooking session lifecycle does not allow interaction"),
		500: errorResponse("Persisted cooking session is invalid"),
		502: errorResponse("Active Cooking generation or output validation failed"),
		503: errorResponse("Active Cooking agent is not configured"),
	},
});

export function createActiveCookingRoute({
	db,
	activeCookingRunner,
}: {
	db: FlemmeDatabase;
	activeCookingRunner?: ActiveCookingRunner;
}) {
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
	const service = createActiveCookingService({ db, activeCookingRunner });

	route.openapi(activeCookingRouteDefinition, async (context) => {
		const output = await service.respond(
			context.get("currentUserId"),
			context.req.valid("param").id,
			context.req.valid("json"),
		);

		return context.json(output, 200);
	});

	return route;
}
