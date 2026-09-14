import {
	createOpenAIModel,
	runActiveCooking,
	runCompletion,
	runCookingAgent,
	runPreCooking,
} from "@flemme/agent";
import { createDatabase } from "@flemme/db";

import { createApp } from "./src/app";
import { readAuthEnvironment } from "./src/modules/auth/auth-environment";
import { createAuthServer } from "./src/modules/auth/auth-server";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to start @flemme/api");
}

const port = Number(Bun.env.PORT ?? 3000);

if (!Number.isInteger(port) || port <= 0) {
	throw new Error("PORT must be a positive integer");
}

const authEnvironment = readAuthEnvironment(Bun.env);
const { db } = createDatabase(databaseUrl);
const auth = createAuthServer(db, authEnvironment);
await auth.$context;
const apiKey = Bun.env.MUX_API_KEY;
const baseUrl = Bun.env.BASE_URL;
const model =
	apiKey && baseUrl
		? createOpenAIModel({
				apiKey,
				baseUrl,
				modelId: "gpt-5.6-luna",
			})
		: undefined;
const recommendationRunner = model
	? (context: Parameters<typeof runCookingAgent>[0]["context"]) =>
			runCookingAgent({ model, context })
	: undefined;
const activeCookingRunner = model
	? (input: Parameters<typeof runActiveCooking>[0]["input"]) =>
			runActiveCooking({ model, input })
	: undefined;
const completionRunner = model
	? (input: Parameters<typeof runCompletion>[0]["input"]) =>
			runCompletion({ model, input })
	: undefined;
const preCookingRunner = model
	? (input: Parameters<typeof runPreCooking>[0]["input"]) =>
			runPreCooking({ model, input })
	: undefined;
const app = createApp({
	authFoundation: { auth, webOrigin: authEnvironment.WEB_ORIGIN },
	db,
	activeCookingRunner,
	completionRunner,
	recommendationRunner,
	preCookingRunner,
});
const server = Bun.serve({
	hostname: "127.0.0.1",
	port,
	fetch: app.fetch,
});

console.log(`Flemme API listening on http://localhost:${server.port}`);
