import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import { cookingSessions, createDatabase, users } from "@flemme/db";
import {
	type RecipeNutritionResult,
	RecipeNutritionResultSchema,
} from "@flemme/nutrition";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
} from "../cooking-session/cooking-session-schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

const completionSnapshot = {
	reply: "The nutrition test dish is complete.",
	summary: {
		title: "Nutrition test dish",
		description: "The production-backed nutrition test dish was completed.",
	},
	notes: [],
};

const completePlan: PreCookingOutput = {
	preparationSummary: { overview: "Prepare supported ingredients." },
	ingredients: [
		{ name: "tomat", quantity: 100, unit: "g" },
		{ name: "minyak kanola", quantity: 1, unit: "sdm" },
		{ name: "garam", quantity: 1, unit: "sdt" },
	],
	equipment: [{ name: "bowl", required: true }],
	preparationSteps: [{ id: "prepare", instruction: "Prepare ingredients." }],
	cookingStages: [
		{
			id: "finish",
			title: "Finish",
			steps: [{ id: "serve", instruction: "Serve the dish." }],
		},
	],
};

const partialPlan: PreCookingOutput = {
	...completePlan,
	preparationSummary: { overview: "Prepare partially supported ingredients." },
	ingredients: [
		{ name: "tomat", quantity: 100, unit: "g" },
		{ name: "telur", quantity: 1, unit: "butir" },
	],
};

const unavailablePlan: PreCookingOutput = {
	...completePlan,
	preparationSummary: { overview: "Prepare Telur Kecap Bawang." },
	ingredients: [
		{ name: "telur", quantity: 4, unit: "butir" },
		{ name: "kecap manis", quantity: 4, unit: "sendok makan" },
		{ name: "bawang merah", quantity: 4, unit: "butir" },
		{ name: "bawang putih", quantity: 2, unit: "siung (besar)" },
		{ name: "minyak goreng", quantity: 2, unit: "sendok makan" },
		{ name: "garam" },
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
const app = createApp({ authFoundation, db });
let ownerUserId = "";
let otherUserId = "";

function recipeForPlan(
	plan: PreCookingOutput,
	servings = 2,
): CookingRecommendation {
	return {
		name: "Nutrition test dish",
		description: "Recipe snapshot for nutrition integration validation.",
		reason: "Exercises production-backed nutrition orchestration.",
		estimatedDuration: { minMinutes: 5, maxMinutes: 10 },
		servings,
		feasibility: "ready",
		ingredients: plan.ingredients.map(({ name }) => ({
			name,
			status: "available",
		})),
		equipment: [{ name: "bowl", status: "available" }],
		preferenceMatches: [],
		requiredConfirmations: [],
		optionalIngredients: [],
		warnings: [],
	};
}

async function createSession(
	plan: PreCookingOutput,
	options: { ready?: boolean; servings?: number; userId?: string } = {},
): Promise<CookingSessionResponse> {
	const selectedRecipe = recipeForPlan(plan, options.servings);
	const recommendationSnapshot: CookingRecommendationOutput = {
		type: "recommendations",
		recommendations: [selectedRecipe],
	};
	const ready = options.ready ?? false;
	const response = await app.request("/cooking-sessions", {
		method: "POST",
		headers: headers(options.userId ?? ownerUserId),
		body: JSON.stringify({
			recommendationSnapshot,
			selectedRecipeSnapshot: selectedRecipe,
			cookingPlan: plan,
			session: {
				status: "active",
				currentStageId: "finish",
				currentStepId: "serve",
				completedStepIds: ready ? ["prepare", "serve"] : ["prepare"],
				changes: [],
			},
		}),
	});

	expect(response.status).toBe(201);
	return CookingSessionResponseSchema.parse(await response.json());
}

async function preview(
	sessionId: string,
	userId = ownerUserId,
): Promise<{ response: Response; result: RecipeNutritionResult }> {
	const response = await app.request(
		`/cooking-sessions/${sessionId}/nutrition`,
		{ headers: headers(userId) },
	);
	const result = RecipeNutritionResultSchema.parse(await response.json());

	return { response, result };
}

async function restore(sessionId: string) {
	const response = await app.request(`/cooking-sessions/${sessionId}`, {
		headers: headers(ownerUserId),
	});

	return CookingSessionResponseSchema.parse(await response.json());
}

async function complete(
	sessionId: string,
	body: unknown = { completionSnapshot },
) {
	return app.request(`/cooking-sessions/${sessionId}/complete`, {
		method: "POST",
		headers: headers(ownerUserId),
		body: JSON.stringify(body),
	});
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

describe("Nutrition API integration", () => {
	test("previews complete production-backed nutrition without mutation", async () => {
		const created = await createSession(completePlan);
		const before = await restore(created.id);
		const first = await preview(created.id);
		const second = await preview(created.id);
		const after = await restore(created.id);

		expect(first.response.status).toBe(200);
		expect(first.result.status).toBe("complete");
		expect(first.result).toEqual(second.result);
		expect(after).toEqual(before);
	});

	test("returns partial nutrition for a trusted subset", async () => {
		const created = await createSession(partialPlan);
		const { response, result } = await preview(created.id);

		expect(response.status).toBe(200);
		expect(result.status).toBe("partial");
		if (result.status === "partial") {
			expect(result.knownNutrition.total.caloriesKcal).toBeGreaterThan(0);
			expect(result.issues).toContainEqual({
				reason: "portion-unavailable",
				ingredientName: "telur",
				ingredientKey: "egg",
				unit: "butir",
			});
		}
	});

	test("returns unavailable for the realistic Telur Kecap plan without fake totals", async () => {
		const created = await createSession(unavailablePlan);
		const { response, result } = await preview(created.id);

		expect(response.status).toBe(200);
		expect(result.status).toBe("unavailable");
		expect("total" in result).toBe(false);
		expect("perServing" in result).toBe(false);
	});

	test("allows preview for paused, abandoned, and completed sessions", async () => {
		const paused = await createSession(completePlan);
		await db
			.update(cookingSessions)
			.set({ status: "paused", pauseReason: "user-request" })
			.where(eq(cookingSessions.id, paused.id));

		const abandoned = await createSession(completePlan);
		await db
			.update(cookingSessions)
			.set({ status: "abandoned" })
			.where(eq(cookingSessions.id, abandoned.id));

		const completed = await createSession(completePlan, { ready: true });
		expect((await complete(completed.id)).status).toBe(200);

		for (const sessionId of [paused.id, abandoned.id, completed.id]) {
			const { response, result } = await preview(sessionId);
			expect(response.status).toBe(200);
			expect(result.status).toBe("complete");
		}
	});

	test("enforces preview ownership and missing-session behavior", async () => {
		const created = await createSession(completePlan);
		const forbidden = await app.request(
			`/cooking-sessions/${created.id}/nutrition`,
			{ headers: headers(otherUserId) },
		);
		const missing = await app.request(
			`/cooking-sessions/${crypto.randomUUID()}/nutrition`,
			{ headers: headers(ownerUserId) },
		);

		expect(forbidden.status).toBe(403);
		expect(ErrorResponseSchema.parse(await forbidden.json()).error.code).toBe(
			"COOKING_SESSION_FORBIDDEN",
		);
		expect(missing.status).toBe(404);
		expect(ErrorResponseSchema.parse(await missing.json()).error.code).toBe(
			"COOKING_SESSION_NOT_FOUND",
		);
	});

	for (const [expectedStatus, plan] of [
		["complete", completePlan],
		["partial", partialPlan],
		["unavailable", unavailablePlan],
	] as const) {
		test(`persists server-calculated ${expectedStatus} nutrition on completion`, async () => {
			const created = await createSession(plan, { ready: true });
			const response = await complete(created.id);
			const completed = CookingSessionResponseSchema.parse(
				await response.json(),
			);
			const restored = await restore(created.id);

			expect(response.status).toBe(200);
			expect(completed.session.status).toBe("completed");
			expect(completed.nutritionSnapshot?.status).toBe(expectedStatus);
			expect(restored.nutritionSnapshot).toEqual(completed.nutritionSnapshot);
			if (expectedStatus === "unavailable") {
				expect("total" in (completed.nutritionSnapshot ?? {})).toBe(false);
			}
		});
	}

	test("rejects client-owned nutrition on create and completion", async () => {
		const forgedNutrition = {
			status: "complete",
			estimated: true,
			servings: 2,
			total: { caloriesKcal: 999_999, proteinG: 0, carbsG: 0, fatG: 0 },
			perServing: {
				caloriesKcal: 499_999.5,
				proteinG: 0,
				carbsG: 0,
				fatG: 0,
			},
		};
		const selectedRecipe = recipeForPlan(completePlan);
		const createResponse = await app.request("/cooking-sessions", {
			method: "POST",
			headers: headers(ownerUserId),
			body: JSON.stringify({
				recommendationSnapshot: {
					type: "recommendations",
					recommendations: [selectedRecipe],
				},
				selectedRecipeSnapshot: selectedRecipe,
				cookingPlan: completePlan,
				session: {
					status: "active",
					currentStageId: "finish",
					currentStepId: "serve",
					completedStepIds: ["prepare", "serve"],
					changes: [],
				},
				nutritionSnapshot: forgedNutrition,
			}),
		});

		expect(createResponse.status).toBe(400);

		const created = await createSession(completePlan, { ready: true });
		const completionResponse = await complete(created.id, {
			completionSnapshot,
			nutritionSnapshot: forgedNutrition,
		});
		const unchanged = await restore(created.id);

		expect(completionResponse.status).toBe(400);
		expect(unchanged.session.status).toBe("active");
		expect(unchanged.completionSnapshot).toBeNull();
		expect(unchanged.nutritionSnapshot).toBeNull();
	});

	test("publishes preview and server-owned completion contracts in OpenAPI", async () => {
		const response = await app.request("/openapi.json");
		const specification = (await response.json()) as {
			paths: Record<
				string,
				{ post?: { requestBody?: unknown }; get?: unknown } | undefined
			>;
		};

		expect(response.status).toBe(200);
		expect(specification.paths).toHaveProperty(
			"/cooking-sessions/{id}/nutrition",
		);
		expect(
			JSON.stringify(
				specification.paths["/cooking-sessions/{id}/complete"]?.post
					?.requestBody,
			),
		).not.toContain("nutritionSnapshot");
	});
});
