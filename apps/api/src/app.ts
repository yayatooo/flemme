import type { FlemmeDatabase } from "@flemme/db";
import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { ApiEnvironment } from "./api-environment";
import { ApiError, createApiErrorPayload } from "./api-error";
import { createActiveCookingRoute } from "./modules/active-cooking/active-cooking-route";
import type { ActiveCookingRunner } from "./modules/active-cooking/active-cooking-service";
import type { AuthServer } from "./modules/auth/auth-server";
import { createCurrentUserMiddleware } from "./modules/auth/current-user-middleware";
import { createCurrentUserRoute } from "./modules/auth/current-user-route";
import { createCompletionRoute } from "./modules/completion/completion-route";
import type { CompletionRunner } from "./modules/completion/completion-service";
import { createCookingRecommendationRoute } from "./modules/cooking-recommendation/cooking-recommendation-route";
import type { CookingRecommendationRunner } from "./modules/cooking-recommendation/cooking-recommendation-service";
import { createCookingSessionRoute } from "./modules/cooking-session/cooking-session-route";
import { createFavoritesRoute } from "./modules/favorites/favorites-route";
import { createHouseholdRoute } from "./modules/household/household-route";
import { createInventoryRoute } from "./modules/inventory/inventory-route";
import { createKitchenRoute } from "./modules/kitchen/kitchen-route";
import { createNutritionRoute } from "./modules/nutrition/nutrition-route";
import { createPreCookingRoute } from "./modules/pre-cooking/pre-cooking-route";
import type { PreCookingRunner } from "./modules/pre-cooking/pre-cooking-service";
import { createProfileRoute } from "./modules/profile/profile-route";

interface CreateAppInput {
	authFoundation: { auth: AuthServer; webOrigin: string };
	db: FlemmeDatabase;
	activeCookingRunner?: ActiveCookingRunner;
	completionRunner?: CompletionRunner;
	recommendationRunner?: CookingRecommendationRunner;
	preCookingRunner?: PreCookingRunner;
}

export function createApp({
	authFoundation,
	db,
	activeCookingRunner,
	completionRunner,
	recommendationRunner,
	preCookingRunner,
}: CreateAppInput) {
	const app = new OpenAPIHono<ApiEnvironment>();
	const currentUserMiddleware = createCurrentUserMiddleware(
		authFoundation.auth,
	);
	app.use(
		"*",
		cors({
			origin: (origin) =>
				origin === authFoundation.webOrigin ? origin : undefined,
			credentials: true,
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type"],
		}),
	);
	app.openAPIRegistry.registerComponent("securitySchemes", "CurrentUser", {
		type: "apiKey",
		in: "cookie",
		name: "better-auth.session_token",
		description:
			"Better Auth HttpOnly session cookie. Secure deployments may apply the framework's __Secure- prefix.",
	});
	app.use("/auth/me", currentUserMiddleware);
	app.route("/auth/me", createCurrentUserRoute(db));
	app.all("/auth/*", (context) => authFoundation.auth.handler(context.req.raw));

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
	for (const path of [
		"/cooking/*",
		"/cooking-sessions/*",
		"/favorites",
		"/favorites/*",
		"/household",
		"/household/*",
		"/inventory",
		"/inventory/*",
		"/kitchen",
		"/kitchen/*",
		"/profile",
		"/profile/*",
	] as const) {
		app.use(path, currentUserMiddleware);
	}
	app.route(
		"/cooking/recommendations",
		createCookingRecommendationRoute({ db, recommendationRunner }),
	);
	app.route(
		"/cooking/pre-cooking",
		createPreCookingRoute({ db, preCookingRunner }),
	);
	app.route("/profile", createProfileRoute(db));
	app.route("/favorites", createFavoritesRoute(db));
	app.route("/household", createHouseholdRoute(db));
	app.route("/inventory", createInventoryRoute(db));
	app.route("/kitchen", createKitchenRoute(db));
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
