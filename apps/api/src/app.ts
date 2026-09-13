import type { FlemmeDatabase } from "@flemme/db";
import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createActiveCookingRoute } from "./active-cooking/active-cooking-route";
import type { ActiveCookingRunner } from "./active-cooking/active-cooking-service";
import type { ApiEnvironment } from "./api-environment";
import { ApiError, createApiErrorPayload } from "./api-error";
import { createCompletionRoute } from "./completion/completion-route";
import type { CompletionRunner } from "./completion/completion-service";
import { createCookingRecommendationRoute } from "./cooking-recommendation/cooking-recommendation-route";
import type { CookingRecommendationRunner } from "./cooking-recommendation/cooking-recommendation-service";
import { createCookingSessionRoute } from "./cooking-session/cooking-session-route";
import { createHouseholdRoute } from "./household/household-route";
import { createNutritionRoute } from "./nutrition/nutrition-route";
import { createPreCookingRoute } from "./pre-cooking/pre-cooking-route";
import type { PreCookingRunner } from "./pre-cooking/pre-cooking-service";
import { createProfileRoute } from "./profile/profile-route";

interface CreateAppInput {
	db: FlemmeDatabase;
	activeCookingRunner?: ActiveCookingRunner;
	completionRunner?: CompletionRunner;
	recommendationRunner?: CookingRecommendationRunner;
	preCookingRunner?: PreCookingRunner;
}

export function createApp({
	db,
	activeCookingRunner,
	completionRunner,
	recommendationRunner,
	preCookingRunner,
}: CreateAppInput) {
	const app = new OpenAPIHono<ApiEnvironment>();
	app.openAPIRegistry.registerComponent("securitySchemes", "DevelopmentUser", {
		type: "apiKey",
		in: "header",
		name: "x-flemme-user-id",
		description:
			"Development-only UUID printed by `bun run --filter @flemme/db db:seed`",
	});

	app.openapi(
		createRoute({
			method: "get",
			path: "/health",
			tags: ["Health"],
			responses: {
				200: {
					description: "API process is healthy",
					content: {
						"application/json": {
							schema: z.object({ status: z.literal("ok") }),
						},
					},
				},
			},
		}),
		(context) => context.json({ status: "ok" as const }, 200),
	);
	app.route(
		"/cooking/recommendations",
		createCookingRecommendationRoute({ db, recommendationRunner }),
	);
	app.route(
		"/cooking/pre-cooking",
		createPreCookingRoute({ db, preCookingRunner }),
	);
	app.route("/profile", createProfileRoute(db));
	app.route("/household", createHouseholdRoute(db));
	app.route("/cooking-sessions", createCookingSessionRoute(db));
	app.route("/cooking-sessions", createNutritionRoute(db));
	app.route(
		"/cooking-sessions",
		createActiveCookingRoute({ db, activeCookingRunner }),
	);
	app.route(
		"/cooking-sessions",
		createCompletionRoute({ db, completionRunner }),
	);
	app.doc("/openapi.json", {
		openapi: "3.1.0",
		info: {
			title: "Flemme API",
			version: "0.1.0",
			description: "Flemme cooking application API",
		},
	});
	app.get(
		"/docs",
		swaggerUI({ url: "/openapi.json", persistAuthorization: true }),
	);

	app.onError((error, context) => {
		if (error instanceof ApiError) {
			return context.json(createApiErrorPayload(error), error.status);
		}

		return context.json(
			{
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected error occurred",
				},
			},
			500,
		);
	});

	return app;
}
