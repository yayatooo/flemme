import type { FlemmeDatabase } from "@flemme/db";
import { createRoute, OpenAPIHono, type z } from "@hono/zod-openapi";

import type { ApiEnvironment } from "../../api-environment";
import { ApiErrorResponseSchema } from "../../api-error";
import { OnboardingStatusResponseSchema } from "./onboarding-schema";
import { createOnboardingService } from "./onboarding-service";

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

const getOnboardingRouteDefinition = createRoute({
	method: "get",
	path: "/",
	tags: ["Onboarding"],
	summary: "Get the current user's onboarding status",
	security: [{ CurrentUser: [] }],
	responses: {
		200: jsonResponse(
			OnboardingStatusResponseSchema,
			"Current onboarding status",
		),
		401: errorResponse("Authentication is required"),
	},
});

const completeOnboardingRouteDefinition = createRoute({
	method: "post",
	path: "/complete",
	tags: ["Onboarding"],
	summary: "Complete onboarding for the current user",
	description:
		"Idempotently persists completion after all required onboarding decisions exist.",
	security: [{ CurrentUser: [] }],
	responses: {
		200: jsonResponse(OnboardingStatusResponseSchema, "Completed onboarding"),
		401: errorResponse("Authentication is required"),
		409: errorResponse("Required onboarding steps are incomplete"),
	},
});

export function createOnboardingRoute(db: FlemmeDatabase) {
	const route = new OpenAPIHono<ApiEnvironment>();
	const service = createOnboardingService(db);

	route.openapi(getOnboardingRouteDefinition, async (context) => {
		return context.json(await service.get(context.get("currentUserId")), 200);
	});
	route.openapi(completeOnboardingRouteDefinition, async (context) => {
		return context.json(
			await service.complete(context.get("currentUserId")),
			200,
		);
	});

	return route;
}
