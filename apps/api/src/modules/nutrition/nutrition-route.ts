import type { FlemmeDatabase } from "@flemme/db";
import { RecipeNutritionResultSchema } from "@flemme/nutrition";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

import {
	CookingSessionParamsSchema,
	CookingSessionResponseSchema,
} from "../cooking-session/cooking-session-schema";
import { createCookingSessionService } from "../cooking-session/cooking-session-service";
import { calculateCookingSessionNutrition } from "./cooking-session-nutrition-service";
import { createNutritionService } from "./nutrition-service";

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
	security: [{ CurrentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
	},
	responses: {
		200: jsonResponse(
			RecipeNutritionResultSchema,
			"Deterministic nutrition result for the persisted plan",
		),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		500: errorResponse(
			"Persisted cooking session or nutrition data is invalid",
		),
	},
});

const generateCookingSessionNutritionRouteDefinition = createRoute({
	method: "post",
	path: "/{id}/nutrition",
	tags: ["Cooking Sessions"],
	summary: "Generate or restore cooking-session nutrition",
	description:
		"Requires an owned completed Cooking Session with Completion output. Deterministically calculates and durably persists one canonical Nutrition snapshot, then reuses it on later requests.",
	security: [{ CurrentUser: [] }],
	request: {
		params: CookingSessionParamsSchema,
	},
	responses: {
		200: jsonResponse(
			CookingSessionResponseSchema,
			"Completed Cooking Session with canonical Nutrition snapshot",
		),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		403: errorResponse("Cooking session belongs to another user"),
		404: errorResponse("Cooking session not found"),
		409: errorResponse(
			"Cooking session is not completed or has no Completion output",
		),
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
	const nutrition = createNutritionService(db);

	route.openapi(getCookingSessionNutritionRouteDefinition, async (context) => {
		const session = await cookingSessions.get(
			context.get("currentUserId"),
			context.req.valid("param").id,
		);
		const nutrition = calculateCookingSessionNutrition({
			cookingPlan: session.cookingPlan,
			servings: session.selectedRecipeSnapshot.servings,
			changes: session.session.changes,
		});

		return context.json(nutrition, 200);
	});

	route.openapi(
		generateCookingSessionNutritionRouteDefinition,
		async (context) => {
			const session = await nutrition.generate(
				context.get("currentUserId"),
				context.req.valid("param").id,
			);

			return context.json(session, 200);
		},
	);

	return route;
}
