import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

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
	summary: "Generate or restore a completion summary",
	description:
		"Requires an owned completed Cooking Session. Generates and durably persists Completion output once, then returns the canonical completed session on retries and refreshes without invoking Nutrition.",
	security: [{ CurrentUser: [] }],
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
			description: "Completed Cooking Session with canonical Completion output",
			content: {
				"application/json": { schema: CompletionResponseSchema },
			},
		},
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		409: errorResponse("Cooking session is not completed"),
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

	route.openapi(completionRouteDefinition, async (context) => {
		const session = await service.generate(
			context.get("currentUserId"),
			context.req.valid("param").id,
			context.req.valid("json"),
		);

		return context.json(session, 200);
	});

	return route;
}
