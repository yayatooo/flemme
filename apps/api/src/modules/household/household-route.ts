import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";

import {
	HouseholdResponseSchema,
	PutHouseholdRequestSchema,
} from "./household-schema";
import { createHouseholdService } from "./household-service";

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

const getHouseholdRouteDefinition = createRoute({
	method: "get",
	path: "/",
	tags: ["Household"],
	summary: "Get the current user's household",
	description:
		"Returns aggregate household counts used by cooking-context orchestration.",
	security: [{ CurrentUser: [] }],
	responses: {
		200: jsonResponse(HouseholdResponseSchema, "Current user's household"),
		401: errorResponse("Authentication is required"),
		404: errorResponse("Household has not been created"),
		500: errorResponse("Persisted household is invalid"),
	},
});

const putHouseholdRouteDefinition = createRoute({
	method: "put",
	path: "/",
	tags: ["Household"],
	summary: "Create or replace the current user's household",
	description:
		"Upserts the complete adults, children, and toddlers aggregate counts. At least one member is required; each count is limited to 20.",
	security: [{ CurrentUser: [] }],
	request: {
		body: jsonBody(PutHouseholdRequestSchema),
	},
	responses: {
		200: jsonResponse(HouseholdResponseSchema, "Saved household"),
		400: errorResponse("Invalid request"),
		401: errorResponse("Authentication is required"),
		500: errorResponse("Household could not be saved"),
	},
});

export function createHouseholdRoute(db: FlemmeDatabase) {
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
	const service = createHouseholdService(db);

	route.openapi(getHouseholdRouteDefinition, async (context) => {
		const household = await service.get(context.get("currentUserId"));
		return context.json(household, 200);
	});

	route.openapi(putHouseholdRouteDefinition, async (context) => {
		const household = await service.put(
			context.get("currentUserId"),
			context.req.valid("json"),
		);
		return context.json(household, 200);
	});

	return route;
}
