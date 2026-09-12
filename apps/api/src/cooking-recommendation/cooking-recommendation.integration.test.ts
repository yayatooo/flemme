import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	CookingRecommendationInput,
	CookingRecommendationOutput,
} from "@flemme/agent";
import {
	cookingSessions,
	createDatabase,
	households,
	inventories,
	inventoryItems,
	kitchenEquipment,
	kitchens,
	userProfiles,
	users,
} from "@flemme/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../app";
import { CookingRecommendationResponseSchema } from "./cooking-recommendation-schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

const recommendationOutput: CookingRecommendationOutput = {
	type: "recommendations",
	recommendations: [
		{
			name: "Savory Salt Test Dish",
			description: "A synthetic recommendation used by API tests.",
			reason: "It uses the available test inventory.",
			estimatedDuration: { minMinutes: 15, maxMinutes: 25 },
			servings: 2,
			feasibility: "ready",
			ingredients: [
				{
					name: "salt",
					status: "available",
					requiredAmount: "5 g",
				},
			],
			equipment: [{ name: "wok", status: "available" }],
			preferenceMatches: ["savory"],
			requiredConfirmations: [],
			optionalIngredients: [],
			warnings: [],
		},
	],
};

const ErrorResponseSchema = z.object({
	error: z.object({ code: z.string(), message: z.string() }),
});

const { client, db } = createDatabase(databaseUrl);
let runner: (context: CookingRecommendationInput) => Promise<unknown>;
let capturedContext: CookingRecommendationInput | undefined;
const app = createApp({
	db,
	recommendationRunner: (context) => runner(context),
});
let userId = "";
let contextlessUserId = "";

function headers(currentUserId: string) {
	return {
		"content-type": "application/json",
		"x-flemme-user-id": currentUserId,
	};
}

async function requestRecommendation(currentUserId: string, body: unknown) {
	return app.request("/cooking/recommendations", {
		method: "POST",
		headers: headers(currentUserId),
		body: JSON.stringify(body),
	});
}

beforeAll(async () => {
	const [user, contextlessUser] = await db
		.insert(users)
		.values([
			{ email: `recommendation-${crypto.randomUUID()}@flemme.local` },
			{ email: `contextless-${crypto.randomUUID()}@flemme.local` },
		])
		.returning({ id: users.id });

	if (!user || !contextlessUser) {
		throw new Error("Recommendation API test users could not be created");
	}

	userId = user.id;
	contextlessUserId = contextlessUser.id;

	await db.insert(userProfiles).values({
		userId,
		displayName: "Recommendation Tester",
		foodPreferences: ["savory", "mild"],
		cookingPreferences: ["simple meals"],
	});
	await db
		.insert(households)
		.values({ userId, adults: 2, children: 1, toddlers: 0 });
	const [kitchen] = await db.insert(kitchens).values({ userId }).returning();
	const [inventory] = await db
		.insert(inventories)
		.values({ userId })
		.returning();

	if (!kitchen || !inventory) {
		throw new Error("Recommendation API test context could not be created");
	}

	await db.insert(kitchenEquipment).values([
		{ kitchenId: kitchen.id, name: "gas stove" },
		{ kitchenId: kitchen.id, name: "wok" },
	]);
	await db.insert(inventoryItems).values({
		inventoryId: inventory.id,
		ingredientKey: "salt",
		quantity: 250,
		unit: "g",
		condition: "fresh",
	});
});

afterAll(async () => {
	if (userId) {
		await db.delete(users).where(eq(users.id, userId));
	}

	if (contextlessUserId) {
		await db.delete(users).where(eq(users.id, contextlessUserId));
	}

	await client.end();
});

describe("cooking recommendation API integration", () => {
	test("loads persistent context and returns validated agent output", async () => {
		runner = async (context) => {
			capturedContext = context;
			return recommendationOutput;
		};

		const response = await requestRecommendation(userId, {
			session: {
				request: "I want a savory dinner.",
				servings: 2,
				availableMinutes: 30,
			},
		});
		const result = CookingRecommendationResponseSchema.parse(
			await response.json(),
		);

		expect(response.status).toBe(200);
		expect(result).toEqual(recommendationOutput);
		expect(capturedContext).toEqual({
			inventory: [
				{
					name: "salt",
					quantity: "250 g",
					condition: "fresh",
				},
			],
			kitchen: { equipment: ["gas stove", "wok"] },
			household: { adults: 2, children: 1, toddlers: 0 },
			foodPreferences: ["savory", "mild"],
			cookingPreferences: ["simple meals"],
			session: {
				request: "I want a savory dinner.",
				servings: 2,
				availableMinutes: 30,
			},
		});

		const persistedSessions = await db
			.select({ id: cookingSessions.id })
			.from(cookingSessions)
			.where(eq(cookingSessions.userId, userId));
		expect(persistedSessions).toHaveLength(0);
	});

	test("request context replaces overlapping persistent values", async () => {
		runner = async (context) => {
			capturedContext = context;
			return recommendationOutput;
		};

		const response = await requestRecommendation(userId, {
			inventory: [
				{
					name: "Kecap manis",
					quantity: "2 tbsp",
					condition: "unknown",
				},
			],
			kitchen: { equipment: ["rice cooker"] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: ["spicy"],
			cookingPreferences: ["one-pot meals"],
			session: { request: "Make this spicy.", servings: 1 },
		});

		expect(response.status).toBe(200);
		expect(capturedContext).toEqual({
			inventory: [
				{
					name: "Kecap manis",
					quantity: "2 tbsp",
					condition: "unknown",
				},
			],
			kitchen: { equipment: ["rice cooker"] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: ["spicy"],
			cookingPreferences: ["one-pot meals"],
			session: { request: "Make this spicy.", servings: 1 },
		});
	});

	test("rejects a request without the required session object", async () => {
		runner = async () => recommendationOutput;
		const response = await requestRecommendation(userId, {});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(400);
		expect(error.error.code).toBe("INVALID_REQUEST");
	});

	test("requires a valid development user", async () => {
		runner = async () => recommendationOutput;
		const missingResponse = await app.request("/cooking/recommendations", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ session: {} }),
		});
		const unknownResponse = await requestRecommendation(crypto.randomUUID(), {
			session: {},
		});

		expect(missingResponse.status).toBe(401);
		expect(unknownResponse.status).toBe(401);
	});

	test("reports missing persistent cooking context without inventing defaults", async () => {
		runner = async () => recommendationOutput;
		const response = await requestRecommendation(contextlessUserId, {
			session: {},
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(422);
		expect(error.error.code).toBe("MISSING_HOUSEHOLD_CONTEXT");
	});

	test("maps agent failures to a controlled error", async () => {
		runner = async () => {
			throw new Error("private provider failure");
		};
		const response = await requestRecommendation(userId, { session: {} });
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(502);
		expect(error.error.code).toBe("RECOMMENDATION_GENERATION_FAILED");
		expect(error.error.message).not.toContain("private provider failure");
	});

	test("rejects invalid agent output at the invocation boundary", async () => {
		runner = async () => ({ type: "recommendations", recommendations: [] });
		const response = await requestRecommendation(userId, { session: {} });
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(502);
		expect(error.error.code).toBe("INVALID_AGENT_OUTPUT");
	});

	test("reports missing agent configuration without exposing environment details", async () => {
		const unconfiguredApp = createApp({ db });
		const response = await unconfiguredApp.request("/cooking/recommendations", {
			method: "POST",
			headers: headers(userId),
			body: JSON.stringify({ session: {} }),
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("AGENT_NOT_CONFIGURED");
		expect(error.error.message).not.toContain("MUX_API_KEY");
		expect(error.error.message).not.toContain("BASE_URL");
	});

	test("publishes the recommendation endpoint in OpenAPI", async () => {
		const response = await app.request("/openapi.json");
		const specification = z
			.object({ paths: z.record(z.string(), z.unknown()) })
			.parse(await response.json());

		expect(response.status).toBe(200);
		expect(Object.keys(specification.paths)).toContain(
			"/cooking/recommendations",
		);
	});
});
