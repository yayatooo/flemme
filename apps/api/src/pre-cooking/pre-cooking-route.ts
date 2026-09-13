import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createDevelopmentAuthMiddleware } from "../auth/development-auth-middleware";
import {
	PreCookingRequestSchema,
	PreCookingResponseSchema,
} from "./pre-cooking-schema";
import {
	createPreCookingService,
	type PreCookingRunner,
} from "./pre-cooking-service";

function errorResponse(description: string) {
	return {
		description,
		content: { "application/json": { schema: ApiErrorResponseSchema } },
	} as const;
}

const preCookingRouteDefinition = createRoute({
	method: "post",
	path: "/",
	tags: ["Pre-Cooking"],
	summary: "Generate a plan for the selected recipe",
	description:
		"Invokes the Pre-Cooking Agent with one selected recommendation and current cooking context. Returns a validated plan without persisting it or creating a cooking session.",
	security: [{ DevelopmentUser: [] }],
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: PreCookingRequestSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Validated pre-cooking plan",
			content: {
				"application/json": { schema: PreCookingResponseSchema },
			},
		},
		400: errorResponse("Invalid request or selected recipe"),
		401: errorResponse("Development user is not authenticated"),
		422: errorResponse("Required persistent cooking context is unavailable"),
		502: errorResponse("Pre-cooking generation or output validation failed"),
		503: errorResponse("Pre-cooking agent is not configured"),
	},
});

export function createPreCookingRoute({
	db,
	preCookingRunner,
}: {
	db: FlemmeDatabase;
	preCookingRunner?: PreCookingRunner;
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
	const service = createPreCookingService({ db, preCookingRunner });

	route.use("*", createDevelopmentAuthMiddleware(db));
	route.openapi(preCookingRouteDefinition, async (context) => {
		const plan = await service.generate(
			context.get("currentUserId"),
			context.req.valid("json"),
		);

		return context.json(plan, 200);
	});

	return route;
}
