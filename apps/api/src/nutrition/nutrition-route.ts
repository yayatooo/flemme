import type { FlemmeDatabase } from "@flemme/db";
import { RecipeNutritionResultSchema } from "@flemme/nutrition";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../api-environment";
import { ApiErrorResponseSchema } from "../api-error";
import { createDevelopmentAuthMiddleware } from "../auth/development-auth-middleware";
import { CookingSessionParamsSchema } from "../cooking-session/cooking-session-schema";
import { createCookingSessionService } from "../cooking-session/cooking-session-service";
import { calculateCookingSessionNutrition } from "./cooking-session-nutrition-service";

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

const getCookingSessionNutritionRouteDefinition = createRoute({
	method: "get",
	path: "/{id}/nutrition",
	tags: ["Cooking Sessions"],
	summary: "Preview cooking-session nutrition",
	description:
		"Calculates complete, partial, or unavailable nutrition from the persisted Cooking Session plan without mutation, AI, or a runtime USDA request.",
	security: [{ DevelopmentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
	},
	responses: {
		200: jsonResponse(
			RecipeNutritionResultSchema,
			"Deterministic nutrition result for the persisted plan",
		),
		400: errorResponse("Invalid request"),
		401: errorResponse("Development user is not authenticated"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		500: errorResponse(
			"Persisted cooking session or nutrition data is invalid",
		),
	},
});

export function createNutritionRoute(db: FlemmeDatabase) {
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
	const cookingSessions = createCookingSessionService(db);

	route.use("*", createDevelopmentAuthMiddleware(db));

	route.openapi(getCookingSessionNutritionRouteDefinition, async (context) => {
		const session = await cookingSessions.get(
			context.get("currentUserId"),
			context.req.valid("param").id,
		);
		const nutrition = calculateCookingSessionNutrition({
			cookingPlan: session.cookingPlan,
			servings: session.selectedRecipeSnapshot.servings,
		});

		return context.json(nutrition, 200);
	});

	return route;
}
