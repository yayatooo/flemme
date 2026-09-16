import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import { cookingSessions, createDatabase, users } from "@flemme/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
} from "./cooking-session-schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

const selectedRecipe: CookingRecommendation = {
	name: "API Test Dish",
	description: "Synthetic recipe for API persistence validation.",
	reason: "Proves the HTTP and PostgreSQL cooking-session flow.",
	estimatedDuration: { minMinutes: 10, maxMinutes: 15 },
	servings: 2,
	feasibility: "ready",
	ingredients: [
		{
			name: "Salt",
			status: "available",
			requiredAmount: "10 grams",
		},
	],
	equipment: [{ name: "stove", status: "available" }],
	preferenceMatches: [],
	requiredConfirmations: [],
	optionalIngredients: [],
	warnings: [],
};

const recommendationSnapshot: CookingRecommendationOutput = {
	type: "recommendations",
	recommendations: [selectedRecipe],
};

const cookingPlan: PreCookingOutput = {
	preparationSummary: { overview: "Prepare the API test dish." },
	ingredients: [{ name: "Salt", quantity: 10, unit: "g" }],
	equipment: [{ name: "stove", required: true }],
	preparationSteps: [{ id: "prepare-salt", instruction: "Measure the salt." }],
	cookingStages: [
		{
			id: "cook-dish",
			title: "Cook dish",
			steps: [
				{ id: "start-cooking", instruction: "Start cooking." },
				{ id: "finish-cooking", instruction: "Finish cooking." },
			],
		},
	],
};

const createRequest: CreateCookingSessionRequest = {
	recommendationSnapshot,
	selectedRecipeSnapshot: selectedRecipe,
	cookingPlan,
	session: {
		status: "active",
		currentStageId: "cook-dish",
		currentStepId: "start-cooking",
		completedStepIds: ["prepare-salt"],
		changes: [],
	},
};

const ErrorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

const { client, db } = createDatabase(databaseUrl);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers: authenticatedHeaders,
} = createSessionAuth(db);
const app = createApp({ authFoundation, db });
let ownerUserId = "";
let otherUserId = "";

async function createSession(userId: string): Promise<CookingSessionResponse> {
	const response = await app.request("/cooking-sessions", {
		method: "POST",
		headers: authenticatedHeaders(userId),
		body: JSON.stringify(createRequest),
	});

	expect(response.status).toBe(201);
	return CookingSessionResponseSchema.parse(await response.json());
}

beforeAll(async () => {
	ownerUserId = await createAuthenticatedUser();
	otherUserId = await createAuthenticatedUser();
});

afterAll(async () => {
	if (ownerUserId) {
		await db.delete(users).where(eq(users.id, ownerUserId));
	}

	if (otherUserId) {
		await db.delete(users).where(eq(users.id, otherUserId));
	}

	await client.end();
});

describe("cooking-session API integration", () => {
	test("reports process health without authentication", async () => {
		const response = await app.request("/health");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: "ok" });
	});

	test("serves OpenAPI documentation and Swagger UI", async () => {
		const specificationResponse = await app.request("/openapi.json");
		const specification = z
			.object({
				openapi: z.literal("3.1.0"),
				paths: z.record(z.string(), z.unknown()),
			})
			.parse(await specificationResponse.json());

		expect(specificationResponse.status).toBe(200);
		expect(Object.keys(specification.paths)).toEqual(
			expect.arrayContaining([
				"/health",
				"/profile",
				"/household",
				"/kitchen",
				"/cooking/recommendations",
				"/cooking/pre-cooking",
				"/cooking-sessions",
				"/cooking-sessions/{id}",
				"/cooking-sessions/{id}/progress",
				"/cooking-sessions/{id}/nutrition",
				"/cooking-sessions/{id}/complete",
				"/cooking-sessions/{id}/active-cooking",
				"/cooking-sessions/{id}/completion",
			]),
		);

		const swaggerResponse = await app.request("/docs");

		expect(swaggerResponse.status).toBe(200);
		expect(swaggerResponse.headers.get("content-type")).toContain("text/html");
		expect(await swaggerResponse.text()).toContain("SwaggerUIBundle");
	});

	test("requires a session for cooking routes", async () => {
		const response = await app.request(
			`/cooking-sessions/${crypto.randomUUID()}`,
		);
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(401);
		expect(error.error.code).toBe("UNAUTHENTICATED");
	});

	test("creates, restores, progresses, completes, and restores a session", async () => {
		const created = await createSession(ownerUserId);

		expect(created.phase).toBe("active_cooking");
		expect(created.cookingPlan).toEqual(cookingPlan);
		expect(created.session.currentStepId).toBe("start-cooking");

		const restoredResponse = await app.request(
			`/cooking-sessions/${created.id}`,
			{ headers: authenticatedHeaders(ownerUserId) },
		);
		const restored = CookingSessionResponseSchema.parse(
			await restoredResponse.json(),
		);

		expect(restoredResponse.status).toBe(200);
		expect(restored.recommendationSnapshot).toEqual(recommendationSnapshot);
		expect(restored.cookingPlan).toEqual(cookingPlan);

		const progressToFinalResponse = await app.request(
			`/cooking-sessions/${created.id}/progress`,
			{
				method: "PATCH",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({
					session: {
						status: "active",
						currentStageId: "cook-dish",
						currentStepId: "finish-cooking",
						completedStepIds: ["prepare-salt", "start-cooking"],
						changes: [],
					},
				}),
			},
		);
		const progressedToFinal = CookingSessionResponseSchema.parse(
			await progressToFinalResponse.json(),
		);

		expect(progressToFinalResponse.status).toBe(200);
		expect(progressedToFinal.session.currentStepId).toBe("finish-cooking");
		expect(progressedToFinal.cookingPlan).toEqual(cookingPlan);

		const completionSnapshot = {
			reply: "The API test dish is complete.",
			summary: {
				title: "API Test Dish",
				description: "The persisted API test dish was completed.",
			},
			notes: [],
		};
		const prematureCompletionResponse = await app.request(
			`/cooking-sessions/${created.id}/complete`,
			{
				method: "POST",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({ completionSnapshot }),
			},
		);
		const prematureCompletionError = ErrorResponseSchema.parse(
			await prematureCompletionResponse.json(),
		);

		expect(prematureCompletionResponse.status).toBe(409);
		expect(prematureCompletionError.error.code).toBe(
			"SESSION_NOT_READY_FOR_COMPLETION",
		);

		const finalProgressResponse = await app.request(
			`/cooking-sessions/${created.id}/progress`,
			{
				method: "PATCH",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({
					session: {
						status: "active",
						currentStageId: "cook-dish",
						currentStepId: "finish-cooking",
						completedStepIds: [
							"prepare-salt",
							"start-cooking",
							"finish-cooking",
						],
						changes: [],
					},
				}),
			},
		);

		expect(finalProgressResponse.status).toBe(200);

		const completionResponse = await app.request(
			`/cooking-sessions/${created.id}/complete`,
			{
				method: "POST",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({ completionSnapshot }),
			},
		);
		const completed = CookingSessionResponseSchema.parse(
			await completionResponse.json(),
		);

		expect(completionResponse.status).toBe(200);
		expect(completed.phase).toBe("completion");
		expect(completed.session.status).toBe("completed");
		expect(completed.completedAt).not.toBeNull();
		expect(completed.nutritionSnapshot?.status).toBe("complete");

		const completedRestoreResponse = await app.request(
			`/cooking-sessions/${created.id}`,
			{ headers: authenticatedHeaders(ownerUserId) },
		);
		const completedRestore = CookingSessionResponseSchema.parse(
			await completedRestoreResponse.json(),
		);

		expect(completedRestoreResponse.status).toBe(200);
		expect(completedRestore.session.status).toBe("completed");
		expect(completedRestore.cookingPlan).toEqual(cookingPlan);
		expect(completedRestore.nutritionSnapshot).toEqual(
			completed.nutritionSnapshot,
		);
	});

	test("returns not found for a missing session", async () => {
		const response = await app.request(
			`/cooking-sessions/${crypto.randomUUID()}`,
			{ headers: authenticatedHeaders(ownerUserId) },
		);
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(404);
		expect(error.error.code).toBe("COOKING_SESSION_NOT_FOUND");
	});

	test("rejects access by another user", async () => {
		const created = await createSession(ownerUserId);
		const response = await app.request(`/cooking-sessions/${created.id}`, {
			headers: authenticatedHeaders(otherUserId),
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(403);
		expect(error.error.code).toBe("COOKING_SESSION_FORBIDDEN");
	});

	test("rejects progress outside the persisted plan", async () => {
		const created = await createSession(ownerUserId);
		const response = await app.request(
			`/cooking-sessions/${created.id}/progress`,
			{
				method: "PATCH",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({
					session: {
						status: "active",
						currentStageId: "invented-stage",
						currentStepId: "invented-step",
						completedStepIds: [],
						changes: [],
					},
				}),
			},
		);
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(422);
		expect(error.error.code).toBe("INVALID_COOKING_PROGRESS");
	});

	test("abandons an active session and prevents reactivation", async () => {
		const created = await createSession(ownerUserId);
		const abandonedResponse = await app.request(
			`/cooking-sessions/${created.id}/progress`,
			{
				method: "PATCH",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({
					session: {
						...created.session,
						status: "abandoned",
					},
				}),
			},
		);
		const abandoned = CookingSessionResponseSchema.parse(
			await abandonedResponse.json(),
		);

		expect(abandonedResponse.status).toBe(200);
		expect(abandoned.session.status).toBe("abandoned");
		expect(abandoned.cookingPlan).toEqual(cookingPlan);

		const reactivateResponse = await app.request(
			`/cooking-sessions/${created.id}/progress`,
			{
				method: "PATCH",
				headers: authenticatedHeaders(ownerUserId),
				body: JSON.stringify({
					session: {
						...created.session,
						status: "active",
					},
				}),
			},
		);
		const error = ErrorResponseSchema.parse(await reactivateResponse.json());

		expect(reactivateResponse.status).toBe(409);
		expect(error.error.code).toBe("INVALID_SESSION_STATE");
	});

	test("returns a controlled error for an invalid persisted snapshot", async () => {
		const created = await createSession(ownerUserId);

		await db.execute(sql`
			update ${cookingSessions}
			set pre_cooking_plan_snapshot = jsonb_build_object('invalid', true)
			where ${cookingSessions.id} = ${created.id}
		`);

		const response = await app.request(`/cooking-sessions/${created.id}`, {
			headers: authenticatedHeaders(ownerUserId),
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(500);
		expect(error.error.code).toBe("INVALID_PERSISTED_SNAPSHOT");
	});
});
