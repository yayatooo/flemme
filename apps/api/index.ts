import {
	createOpenRouterModel,
	createRecommendationTraceObserver,
	readRecommendationObservabilityConfig,
	runActiveCooking,
	runCompletion,
	runCookingAgent,
	runPreCooking,
} from "@flemme/agent";
import { createDatabase } from "@flemme/db";

import { createApp } from "./src/app";
import { readAuthEnvironment } from "./src/modules/auth/auth-environment";
import { createAuthServer } from "./src/modules/auth/auth-server";
import { readRuntimeEnvironment } from "./src/runtime-environment";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to start @flemme/api");
}

const runtimeEnvironment = readRuntimeEnvironment(Bun.env);
const authEnvironment = readAuthEnvironment(Bun.env);
const recommendationObservability = createRecommendationTraceObserver(
	readRecommendationObservabilityConfig(Bun.env),
);
const { client, db } = createDatabase(databaseUrl);
const auth = createAuthServer(db, authEnvironment);
await auth.$context;
const openRouterApiKey = Bun.env.OPENROUTER_API_KEY ?? Bun.env.OPEN_API_KEY;
const model = openRouterApiKey
	? createOpenRouterModel({
			apiKey: openRouterApiKey,
			modelId: Bun.env.OPENROUTER_MODEL,
		})
	: undefined;
const recommendationRunner = model
	? (context: Parameters<typeof runCookingAgent>[0]["context"]) =>
			runCookingAgent({
				model,
				context,
				observability: recommendationObservability,
			})
	: undefined;
const activeCookingRunner = model
	? (input: Parameters<typeof runActiveCooking>[0]["input"]) =>
			runActiveCooking({
				model,
				input,
				observability: recommendationObservability,
			})
	: undefined;
const completionRunner = model
	? (input: Parameters<typeof runCompletion>[0]["input"]) =>
			runCompletion({
				model,
				input,
				observability: recommendationObservability,
			})
	: undefined;
const preCookingRunner = model
	? (input: Parameters<typeof runPreCooking>[0]["input"]) =>
			runPreCooking({
				model,
				input,
				observability: recommendationObservability,
			})
	: undefined;
const app = createApp({
	authFoundation: { auth, webOrigin: authEnvironment.WEB_ORIGIN },
	db,
	readinessCheck: async () => {
		const query = client`select 1 as ready`;
		const timeout = setTimeout(() => query.cancel(), 2_000);
		try {
			await query;
			return true;
		} catch {
			return false;
		} finally {
			clearTimeout(timeout);
		}
	},
	activeCookingRunner,
	completionRunner,
	recommendationRunner,
	preCookingRunner,
});
const server = Bun.serve({
	hostname: runtimeEnvironment.API_HOST,
	port: runtimeEnvironment.PORT,
	fetch: app.fetch,
});

console.log(
	`Flemme API listening on http://${runtimeEnvironment.API_HOST}:${server.port}`,
);

let shutdownPromise: Promise<void> | undefined;

function shutdown(signal: "SIGINT" | "SIGTERM") {
	if (shutdownPromise) return shutdownPromise;
	shutdownPromise = (async () => {
		console.log(`Flemme API received ${signal}; shutting down.`);
		let forceStop: ReturnType<typeof setTimeout> | undefined;
		try {
			await Promise.race([
				server.stop(false),
				new Promise<void>((resolve) => {
					forceStop = setTimeout(resolve, 8_000);
				}),
			]);
		} finally {
			if (forceStop) clearTimeout(forceStop);
			await server.stop(true);
			await client.end({ timeout: 2 });
		}
	})();
	return shutdownPromise;
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
