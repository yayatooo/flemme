import { createOpenAIModel, runCookingAgent } from "@flemme/agent";
import { createDatabase } from "@flemme/db";

import { createApp } from "./src/app";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to start @flemme/api");
}

if (Bun.env.NODE_ENV === "production") {
	throw new Error(
		"The development authentication adapter must be replaced before production",
	);
}

const port = Number(Bun.env.PORT ?? 3000);

if (!Number.isInteger(port) || port <= 0) {
	throw new Error("PORT must be a positive integer");
}

const { db } = createDatabase(databaseUrl);
const apiKey = Bun.env.MUX_API_KEY;
const baseUrl = Bun.env.BASE_URL;
const recommendationRunner =
	apiKey && baseUrl
		? (() => {
				const model = createOpenAIModel({
					apiKey,
					baseUrl,
					modelId: "gpt-5.6-luna",
				});

				return (context: Parameters<typeof runCookingAgent>[0]["context"]) =>
					runCookingAgent({ model, context });
			})()
		: undefined;
const app = createApp({ db, recommendationRunner });
const server = Bun.serve({
	hostname: "127.0.0.1",
	port,
	fetch: app.fetch,
});

console.log(`Flemme API listening on http://localhost:${server.port}`);
