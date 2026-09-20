import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	CookingRecommendation,
	PreCookingInput,
	PreCookingOutput,
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

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { PreCookingResponseSchema } from "./pre-cooking-schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

const selectedRecipe: CookingRecommendation = {
	name: "Savory Salt Test Dish",
	description: "A synthetic selected recipe used by API tests.",
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
};

const preCookingOutput: PreCookingOutput = {
	preparationSummary: {
		overview: "Measure the ingredient before cooking.",
		preparationTimeMinutes: 2,
		cookingTimeMinutes: 10,
	},
	ingredients: [{ name: "salt", quantity: 5, unit: "g" }],
	equipment: [{ name: "wok", required: true }],
	preparationSteps: [
		{ id: "prep-measure-salt", instruction: "Measure 5 g of salt." },
	],
	cookingStages: [
		{
			id: "stage-cook",
			title: "Cook",
			steps: [
				{
					id: "cook-dish",
					instruction: "Cook the test dish in the wok.",
					timing: { level: "short", cue: "The dish is evenly hot." },
				},
			],
		},
	],
};

const ErrorResponseSchema = z.object({
	error: z.object({ code: z.string(), message: z.string() }),
});

const { client, db } = createDatabase(databaseUrl);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers,
} = createSessionAuth(db);
let runner: (input: PreCookingInput) => Promise<unknown>;
let capturedInput: PreCookingInput | undefined;
const app = createApp({
	authFoundation,
	db,
	preCookingRunner: (input) => runner(input),
});
let userId = "";
let contextlessUserId = "";

async function requestPreCooking(currentUserId: string, body: unknown) {
	return app.request("/api/cooking/pre-cooking", {
		method: "POST",
		headers: headers(currentUserId),
		body: JSON.stringify(body),
	});
}

beforeAll(async () => {
	userId = await createAuthenticatedUser();
	contextlessUserId = await createAuthenticatedUser();

	await db.insert(userProfiles).values({
		userId,
		displayName: "Pre-Cooking Tester",
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
		throw new Error("Pre-Cooking API test context could not be created");
	}

	await db.insert(kitchenEquipment).values([
		{ kitchenId: kitchen.id, name: "gas stove" },
		{ kitchenId: kitchen.id, name: "wok" },
	]);
	await db.insert(inventoryItems).values({
		inventoryId: inventory.id,
		ingredientKey: "salt",
		identityKey: "salt",
		name: "salt",
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

describe("pre-cooking API integration", () => {
	test("loads persistent context and returns validated agent output", async () => {
		runner = async (input) => {
			capturedInput = input;
			return preCookingOutput;
		};

		const response = await requestPreCooking(userId, {
			selectedRecipe,
			session: {
				request: "Prepare the selected dish.",
				servings: 2,
				availableMinutes: 30,
			},
		});
		const result = PreCookingResponseSchema.parse(await response.json());

		expect(response.status).toBe(200);
		expect(result).toEqual(preCookingOutput);
		expect(capturedInput).toEqual({
			selectedRecipe,
			context: {
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
					request: "Prepare the selected dish.",
					servings: 2,
					availableMinutes: 30,
				},
			},
		});

		const persistedSessions = await db
			.select({ id: cookingSessions.id })
			.from(cookingSessions)
			.where(eq(cookingSessions.userId, userId));
		expect(persistedSessions).toHaveLength(0);
	});

	test("request context replaces overlapping persistent values", async () => {
		runner = async (input) => {
			capturedInput = input;
			return preCookingOutput;
		};

		const response = await requestPreCooking(userId, {
			selectedRecipe,
			inventory: [{ name: "pepper", quantity: "1 tsp" }],
			kitchen: { equipment: ["saucepan"] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: ["spicy"],
			cookingPreferences: ["one-pot meals"],
			session: { request: "Prepare it spicy.", servings: 1 },
		});

		expect(response.status).toBe(200);
		expect(capturedInput?.context).toEqual({
			inventory: [{ name: "pepper", quantity: "1 tsp" }],
			kitchen: { equipment: ["saucepan"] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: ["spicy"],
			cookingPreferences: ["one-pot meals"],
			session: { request: "Prepare it spicy.", servings: 1 },
		});
	});

	test("rejects an invalid request", async () => {
		runner = async () => preCookingOutput;
		const response = await requestPreCooking(userId, { selectedRecipe });
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(400);
		expect(error.error.code).toBe("INVALID_REQUEST");
	});

	test("rejects an invalid selected recipe", async () => {
		runner = async () => preCookingOutput;
		const response = await requestPreCooking(userId, {
			selectedRecipe: { ...selectedRecipe, servings: 0 },
			session: {},
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(400);
		expect(error.error.code).toBe("INVALID_REQUEST");
	});

	test("rejects missing sessions and sessions for deleted users", async () => {
		runner = async () => preCookingOutput;
		const deletedUserId = await createAuthenticatedUser();
		await db.delete(users).where(eq(users.id, deletedUserId));
		const missingResponse = await app.request("/api/cooking/pre-cooking", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ selectedRecipe, session: {} }),
		});
		const deletedUserResponse = await requestPreCooking(deletedUserId, {
			selectedRecipe,
			session: {},
		});

		expect(missingResponse.status).toBe(401);
		expect(deletedUserResponse.status).toBe(401);
	});

	test("reports missing persistent cooking context", async () => {
		runner = async () => preCookingOutput;
		const response = await requestPreCooking(contextlessUserId, {
			selectedRecipe,
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
		const response = await requestPreCooking(userId, {
			selectedRecipe,
			session: {},
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(502);
		expect(error.error.code).toBe("PRE_COOKING_GENERATION_FAILED");
		expect(error.error.message).not.toContain("private provider failure");
	});

	test("rejects invalid agent output", async () => {
		runner = async () => ({ cookingStages: [] });
		const response = await requestPreCooking(userId, {
			selectedRecipe,
			session: {},
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(502);
		expect(error.error.code).toBe("INVALID_AGENT_OUTPUT");
	});

	test("reports missing agent configuration safely", async () => {
		const unconfiguredApp = createApp({
			authFoundation,
			db,
		});
		const response = await unconfiguredApp.request("/api/cooking/pre-cooking", {
			method: "POST",
			headers: headers(userId),
			body: JSON.stringify({ selectedRecipe, session: {} }),
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("AGENT_NOT_CONFIGURED");
		expect(error.error.message).not.toContain("MUX_API_KEY");
		expect(error.error.message).not.toContain("BASE_URL");
	});

	test("publishes the authenticated pre-cooking endpoint in OpenAPI", async () => {
		const response = await app.request("/api/openapi.json");
		const specification = z
			.object({
				components: z.object({
					securitySchemes: z.object({
						CurrentUser: z.object({
							type: z.literal("apiKey"),
							in: z.literal("cookie"),
							name: z.literal("better-auth.session_token"),
						}),
					}),
				}),
				paths: z.record(z.string(), z.unknown()),
			})
			.parse(await response.json());
		const preCookingOperation = z
			.object({
				post: z.object({
					security: z.array(z.object({ CurrentUser: z.array(z.string()) })),
				}),
			})
			.parse(specification.paths["/api/cooking/pre-cooking"]);

		expect(response.status).toBe(200);
		expect(Object.keys(specification.paths)).toContain(
			"/api/cooking/pre-cooking",
		);
		expect(preCookingOperation.post.security).toEqual([{ CurrentUser: [] }]);
	});
});
