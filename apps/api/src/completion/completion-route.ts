import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createDevelopmentAuthMiddleware } from "../auth/development-auth-middleware";
import { CookingSessionParamsSchema } from "../cooking-session/cooking-session-schema";
import {
	CompletionRequestSchema,
	CompletionResponseSchema,
} from "./completion-schema";
import {
	type CompletionRunner,
	createCompletionService,
} from "./completion-service";

function errorResponse(description: string) {
	return {
		description,
		content: { "application/json": { schema: ApiErrorResponseSchema } },
	} as const;
}

const completionRouteDefinition = createRoute({
	method: "post",
	path: "/{id}/completion",
	tags: ["Completion"],
	summary: "Generate a completion summary",
	description:
		"Requires an owned completion-ready session and returns validated Completion AI output without mutating or completing the session. The output may be submitted as completionSnapshot to the separate complete endpoint.",
	security: [{ DevelopmentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": { schema: CompletionRequestSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Validated Completion AI output",
			content: {
				"application/json": { schema: CompletionResponseSchema },
			},
		},
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		409: errorResponse(
			"Session state or final-step progress is not ready for Completion AI",
		),
		500: errorResponse("Persisted cooking session is invalid"),
		502: errorResponse("Completion generation or output validation failed"),
		503: errorResponse("Completion agent is not configured"),
	},
});

export function createCompletionRoute({
	db,
	completionRunner,
}: {
	db: FlemmeDatabase;
	completionRunner?: CompletionRunner;
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
	const service = createCompletionService({ db, completionRunner });

	route.use("*", createDevelopmentAuthMiddleware(db));
	route.openapi(completionRouteDefinition, async (context) => {
		const output = await service.generate(
			context.get("currentUserId"),
			context.req.valid("param").id,
			context.req.valid("json"),
		);

		return context.json(output, 200);
	});

	return route;
}
