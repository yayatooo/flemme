import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";

import {
	CookingRecommendationRequestSchema,
	CookingRecommendationResponseSchema,
} from "./cooking-recommendation-schema";
import {
	type CookingRecommendationRunner,
	createCookingRecommendationService,
} from "./cooking-recommendation-service";

function errorResponse(description: string) {
	return {
		description,
		content: { "application/json": { schema: ApiErrorResponseSchema } },
	} as const;
}

const recommendationRouteDefinition = createRoute({
	method: "post",
	path: "/",
	tags: ["Cooking Recommendations"],
	summary: "Generate cooking recommendations",
	description:
		"Builds authenticated cooking context and invokes the Recommendation Agent. Does not select a recipe, persist a session, or mutate inventory.",
	security: [{ CurrentUser: [] }],
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: CookingRecommendationRequestSchema },
			},
		},
	},
	responses: {
		200: {
			description: "Validated cooking recommendation result",
			content: {
				"application/json": { schema: CookingRecommendationResponseSchema },
			},
		},
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		422: errorResponse("Required persistent cooking context is unavailable"),
		502: errorResponse("Recommendation generation or output validation failed"),
		503: errorResponse("Recommendation agent is not configured"),
	},
});

export function createCookingRecommendationRoute({
	db,
	recommendationRunner,
}: {
	db: FlemmeDatabase;
	recommendationRunner?: CookingRecommendationRunner;
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
	const service = createCookingRecommendationService({
		db,
		recommendationRunner,
	});

	route.openapi(recommendationRouteDefinition, async (context) => {
		const recommendation = await service.recommend(
			context.get("currentUserId"),
			context.req.valid("json"),
		);

		return context.json(recommendation, 200);
	});

	return route;
}
