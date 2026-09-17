import { afterAll, expect, test } from "bun:test";
import { CookingHistoryPageSchema } from "@flemme/contracts/cooking-history";
import { cookingSessions, createDatabase, favorites, users } from "@flemme/db";
import type { RecipeNutritionResult } from "@flemme/nutrition";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { CookingSessionResponseSchema } from "./cooking-session-schema";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");

const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers,
} = createSessionAuth(db);
const app = createApp({ authFoundation, db });
const userIds: string[] = [];

const completionSnapshot = {
	reply: "The History fixture is complete.",
	summary: {
		title: "A finished meal",
		description: "Warm, savory, and ready to serve.",
	},
	notes: [],
};

const completeNutrition: RecipeNutritionResult = {
	status: "complete",
	estimated: true,
	servings: 2,
	includedIngredients: [],
	total: { caloriesKcal: 840, proteinG: 36, carbsG: 80, fatG: 28 },
	perServing: { caloriesKcal: 420, proteinG: 18, carbsG: 40, fatG: 14 },
};

const partialNutrition: RecipeNutritionResult = {
	status: "partial",
	estimated: true,
	servings: 2,
	includedIngredients: [],
	knownNutrition: {
		total: { caloriesKcal: 600, proteinG: 24, carbsG: 60, fatG: 20 },
		perServing: { caloriesKcal: 300, proteinG: 12, carbsG: 30, fatG: 10 },
	},
	missingIngredientKeys: ["mystery-spice"],
};

const unavailableNutrition: RecipeNutritionResult = {
	status: "unavailable",
	estimated: true,
	servings: 2,
	includedIngredients: [],
	issues: [
		{
			reason: "reference-missing",
			ingredientName: "Mystery spice",
			ingredientKey: "mystery-spice",
		},
	],
};

async function user() {
	const userId = await createAuthenticatedUser();
	userIds.push(userId);
	return userId;
}

async function createSession(userId: string, name: string) {
	const recipe = {
		name,
		description: "A persisted History test recipe.",
		reason: "Exercises the completed-session projection.",
		estimatedDuration: { minMinutes: 10, maxMinutes: 15 },
		servings: 2,
		feasibility: "ready" as const,
		ingredients: [],
		equipment: [],
		preferenceMatches: [],
		requiredConfirmations: [],
		optionalIngredients: [],
		warnings: [],
	};
	const response = await app.request("/cooking-sessions", {
		method: "POST",
		headers: headers(userId),
		body: JSON.stringify({
			recommendationSnapshot: {
				type: "recommendations",
				recommendations: [recipe],
			},
			selectedRecipeSnapshot: recipe,
			cookingPlan: {
				preparationSummary: { overview: "Prepare the History fixture." },
				ingredients: [],
				equipment: [],
				preparationSteps: [],
				cookingStages: [
					{
						id: "cook-stage",
						title: "Cook",
						steps: [{ id: "finish-step", instruction: "Finish the meal." }],
					},
				],
			},
			session: {
				status: "active",
				currentStageId: "cook-stage",
				currentStepId: "finish-step",
				completedStepIds: [],
				changes: [],
			},
		}),
	});
	expect(response.status).toBe(201);
	return CookingSessionResponseSchema.parse(await response.json());
}

async function completeSession(
	sessionId: string,
	options: {
		completedAt?: Date;
		createdAt?: Date;
		customName?: string;
		completion?: typeof completionSnapshot | null;
		nutrition?: RecipeNutritionResult | null;
	} = {},
) {
	await db
		.update(cookingSessions)
		.set({
			status: "completed",
			phase: "completion",
			completedStepIds: ["finish-step"],
			completedAt: options.completedAt ?? new Date("2026-09-17T20:42:00Z"),
			...(options.createdAt ? { createdAt: options.createdAt } : {}),
			customName: options.customName,
			completionSnapshot:
				options.completion === undefined
					? completionSnapshot
					: options.completion,
			nutritionSnapshot:
				options.nutrition === undefined ? completeNutrition : options.nutrition,
		})
		.where(eq(cookingSessions.id, sessionId));
}

async function history(userId: string, query = "") {
	const response = await app.request(`/cooking-sessions/history${query}`, {
		headers: headers(userId),
	});
	return {
		response,
		payload:
			response.status === 200
				? CookingHistoryPageSchema.parse(await response.json())
				: null,
	};
}

afterAll(async () => {
	if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
	await client.end();
});

test("History returns an empty bounded page for a user without completed sessions", async () => {
	const { response, payload } = await history(await user());

	expect(response.status).toBe(200);
	expect(payload).toEqual({ items: [], nextOffset: null });
});

test("History exposes only owned completed sessions and projects canonical snapshots", async () => {
	const ownerId = await user();
	const otherId = await user();
	const completed = await createSession(ownerId, "Original meal name");
	await completeSession(completed.id);
	await db.insert(favorites).values({
		userId: ownerId,
		cookingSessionId: completed.id,
	});

	await createSession(ownerId, "Active meal");
	const paused = await createSession(ownerId, "Paused meal");
	await db
		.update(cookingSessions)
		.set({ status: "paused", pauseReason: "interruption" })
		.where(eq(cookingSessions.id, paused.id));
	const abandoned = await createSession(ownerId, "Abandoned meal");
	await db
		.update(cookingSessions)
		.set({ status: "abandoned" })
		.where(eq(cookingSessions.id, abandoned.id));
	const crossUser = await createSession(otherId, "Cross-user meal");
	await completeSession(crossUser.id);

	const { payload } = await history(ownerId);
	expect(payload?.items).toHaveLength(1);
	expect(payload?.items[0]).toEqual({
		sessionId: completed.id,
		displayName: "Original meal name",
		completedAt: "2026-09-17T20:42:00.000Z",
		completionSummary: completionSnapshot.summary,
		nutrition: {
			status: "complete",
			estimated: true,
			caloriesKcal: 420,
			proteinG: 18,
		},
		isFavorite: true,
	});
});

test("History preserves custom names and complete, partial, unavailable, or absent Nutrition state", async () => {
	const userId = await user();
	const complete = await createSession(userId, "Complete original");
	const partial = await createSession(userId, "Partial original");
	const unavailable = await createSession(userId, "Unavailable original");
	const absent = await createSession(userId, "No Nutrition original");
	await completeSession(complete.id, {
		completedAt: new Date("2026-04-04T00:00:00Z"),
		customName: "My renamed meal",
		nutrition: completeNutrition,
	});
	await completeSession(partial.id, {
		completedAt: new Date("2026-04-03T00:00:00Z"),
		nutrition: partialNutrition,
	});
	await completeSession(unavailable.id, {
		completedAt: new Date("2026-04-02T00:00:00Z"),
		nutrition: unavailableNutrition,
	});
	await completeSession(absent.id, {
		completedAt: new Date("2026-04-01T00:00:00Z"),
		completion: null,
		nutrition: null,
	});

	const { payload } = await history(userId);
	const items = payload?.items ?? [];
	expect(items.map((item) => item.displayName)).toEqual([
		"My renamed meal",
		"Partial original",
		"Unavailable original",
		"No Nutrition original",
	]);
	expect(items.map((item) => item.nutrition)).toEqual([
		{ status: "complete", estimated: true, caloriesKcal: 420, proteinG: 18 },
		{ status: "partial", estimated: true, caloriesKcal: 300, proteinG: 12 },
		{ status: "unavailable" },
		null,
	]);
	expect(items[3]?.completionSummary).toBeNull();
	expect(items.every((item) => !item.isFavorite)).toBe(true);
});

test("History orders deterministically and paginates without fetching every session", async () => {
	const userId = await user();
	const newest = await createSession(userId, "Newest");
	const tieA = await createSession(userId, "Tie A");
	const tieB = await createSession(userId, "Tie B");
	const oldest = await createSession(userId, "Oldest");
	const tiedCreatedAt = new Date("2026-02-01T00:00:00Z");
	await completeSession(newest.id, {
		completedAt: new Date("2026-03-01T00:00:00Z"),
	});
	await completeSession(tieA.id, {
		completedAt: new Date("2026-02-01T00:00:00Z"),
		createdAt: tiedCreatedAt,
	});
	await completeSession(tieB.id, {
		completedAt: new Date("2026-02-01T00:00:00Z"),
		createdAt: tiedCreatedAt,
	});
	await completeSession(oldest.id, {
		completedAt: new Date("2026-01-01T00:00:00Z"),
	});

	const first = await history(userId, "?limit=2&offset=0");
	const second = await history(userId, "?limit=2&offset=2");
	const tiedIds = [tieA.id, tieB.id].sort().reverse();
	const expected = [newest.id, ...tiedIds, oldest.id];

	expect(first.payload?.items.map((item) => item.sessionId)).toEqual(
		expected.slice(0, 2),
	);
	expect(first.payload?.nextOffset).toBe(2);
	expect(second.payload?.items.map((item) => item.sessionId)).toEqual(
		expected.slice(2),
	);
	expect(second.payload?.nextOffset).toBeNull();

	const invalid = await history(userId, "?limit=21");
	expect(invalid.response.status).toBe(400);
	expect(invalid.payload).toBeNull();
});
