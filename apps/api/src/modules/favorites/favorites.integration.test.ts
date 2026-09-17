import { afterAll, expect, test } from "bun:test";
import { CookingHistoryPageSchema } from "@flemme/contracts/cooking-history";
import { cookingSessions, createDatabase, favorites, users } from "@flemme/db";
import type { RecipeNutritionResult } from "@flemme/nutrition";
import { eq, inArray, sql } from "drizzle-orm";
import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { createCookingSessionService } from "../cooking-session/cooking-session-service";
import {
	FavoriteResponseSchema,
	FavoritesResponseSchema,
} from "./favorites-schema";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers,
} = createSessionAuth(db);
const app = createApp({ authFoundation, db });
const sessionService = createCookingSessionService(db);
const ids: string[] = [];

const completeNutrition: RecipeNutritionResult = {
	status: "complete",
	estimated: true,
	servings: 1,
	includedIngredients: [],
	total: { caloriesKcal: 420, proteinG: 18, carbsG: 40, fatG: 14 },
	perServing: { caloriesKcal: 420, proteinG: 18, carbsG: 40, fatG: 14 },
};
const partialNutrition: RecipeNutritionResult = {
	status: "partial",
	estimated: true,
	servings: 1,
	includedIngredients: [],
	knownNutrition: {
		total: { caloriesKcal: 300, proteinG: 12, carbsG: 30, fatG: 10 },
		perServing: { caloriesKcal: 300, proteinG: 12, carbsG: 30, fatG: 10 },
	},
	missingIngredientKeys: ["mystery"],
};
const unavailableNutrition: RecipeNutritionResult = {
	status: "unavailable",
	estimated: true,
	servings: 1,
	includedIngredients: [],
	issues: [{ reason: "ingredient-unresolved", ingredientName: "Mystery" }],
};

async function user() {
	const userId = await createAuthenticatedUser();
	ids.push(userId);
	return userId;
}

afterAll(async () => {
	if (ids.length) await db.delete(users).where(inArray(users.id, ids));
	await client.end();
});

function request(
	uid: string,
	method = "GET",
	path = "/favorites",
	body?: unknown,
) {
	return app.request(path, {
		method,
		headers: headers(uid),
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
}

async function session(uid: string, complete = true) {
	const recipe = {
		name: "Historical dish",
		description: "Historical description",
		reason: "Test",
		estimatedDuration: { minMinutes: 1, maxMinutes: 2 },
		servings: 1,
		feasibility: "ready" as const,
		ingredients: [],
		equipment: [],
		preferenceMatches: [],
		requiredConfirmations: [],
		optionalIngredients: [],
		warnings: [],
	};
	const created = await sessionService.create(uid, {
		recommendationSnapshot: {
			type: "recommendations",
			recommendations: [recipe],
		},
		selectedRecipeSnapshot: recipe,
		cookingPlan: {
			preparationSummary: { overview: "Prepare" },
			ingredients: [{ name: "garlic", quantity: 1, unit: "g" }],
			equipment: [],
			preparationSteps: [],
			cookingStages: [
				{
					id: "cook",
					title: "Cook",
					steps: [{ id: "finish", instruction: "Finish" }],
				},
			],
		},
		session: {
			status: "active",
			currentStageId: "cook",
			currentStepId: "finish",
			completedStepIds: ["finish"],
			changes: [],
		},
	});
	if (!complete) return created;
	return sessionService.complete(uid, created.id, {
		completionSnapshot: {
			reply: "Done",
			summary: {
				title: "Historical dish",
				description: "Warm and ready to serve.",
			},
			notes: [],
		},
	});
}

async function favorite(uid: string, cookingSessionId: string) {
	const response = await request(uid, "POST", "/favorites", {
		cookingSessionId,
	});
	expect(response.status).toBe(201);
	return FavoriteResponseSchema.parse(await response.json());
}

async function list(uid: string, query = "") {
	const response = await request(uid, "GET", `/favorites${query}`);
	return {
		response,
		payload:
			response.status === 200
				? FavoritesResponseSchema.parse(await response.json())
				: null,
	};
}

test("empty, create, rich projection, delete, and preserved completed History", async () => {
	const uid = await user();
	expect((await list(uid)).payload).toEqual({ items: [], nextOffset: null });
	const cooked = await session(uid);
	await db
		.update(cookingSessions)
		.set({
			customName: "My saved dinner",
			nutritionSnapshot: completeNutrition,
		})
		.where(eq(cookingSessions.id, cooked.id));

	const item = await favorite(uid, cooked.id);
	expect(item).toMatchObject({
		cookingSessionId: cooked.id,
		displayName: "My saved dinner",
		completedAt: cooked.completedAt,
		completionSummary: {
			title: "Historical dish",
			description: "Warm and ready to serve.",
		},
		nutrition: {
			status: "complete",
			estimated: true,
			caloriesKcal: 420,
			proteinG: 18,
		},
		recipe: {
			name: "Historical dish",
			description: "Historical description",
			servings: 1,
			estimatedDuration: { minMinutes: 1, maxMinutes: 2 },
		},
	});
	expect((await list(uid)).payload?.items).toEqual([item]);
	expect(
		(await request(uid, "POST", "/favorites", { cookingSessionId: cooked.id }))
			.status,
	).toBe(409);

	const historyBefore = CookingHistoryPageSchema.parse(
		await (
			await app.request("/cooking-sessions/history", {
				headers: headers(uid),
			})
		).json(),
	);
	expect(historyBefore.items[0]).toMatchObject({
		sessionId: cooked.id,
		isFavorite: true,
	});

	expect((await request(uid, "DELETE", `/favorites/${item.id}`)).status).toBe(
		204,
	);
	const restored = await sessionService.get(uid, cooked.id);
	expect(restored.session.status).toBe("completed");
	expect(restored.completionSnapshot).toEqual(cooked.completionSnapshot);
	expect(restored.nutritionSnapshot).toEqual(completeNutrition);
	expect((await list(uid)).payload).toEqual({ items: [], nextOffset: null });
	const historyAfter = CookingHistoryPageSchema.parse(
		await (
			await app.request("/cooking-sessions/history", {
				headers: headers(uid),
			})
		).json(),
	);
	expect(historyAfter.items[0]).toMatchObject({
		sessionId: cooked.id,
		isFavorite: false,
	});
});

test("Favorite projection preserves original recipe while following display name and persisted Nutrition", async () => {
	const uid = await user();
	const complete = await session(uid);
	const partial = await session(uid);
	const unavailable = await session(uid);
	await db
		.update(cookingSessions)
		.set({
			customName: "My renamed meal",
			nutritionSnapshot: completeNutrition,
		})
		.where(eq(cookingSessions.id, complete.id));
	await db
		.update(cookingSessions)
		.set({ nutritionSnapshot: partialNutrition })
		.where(eq(cookingSessions.id, partial.id));
	await db
		.update(cookingSessions)
		.set({ nutritionSnapshot: unavailableNutrition })
		.where(eq(cookingSessions.id, unavailable.id));
	await favorite(uid, complete.id);
	await favorite(uid, partial.id);
	await favorite(uid, unavailable.id);

	const items = (await list(uid)).payload?.items ?? [];
	const bySession = new Map(items.map((item) => [item.cookingSessionId, item]));
	expect(bySession.get(complete.id)).toMatchObject({
		displayName: "My renamed meal",
		recipe: { name: "Historical dish" },
		nutrition: {
			status: "complete",
			caloriesKcal: 420,
			proteinG: 18,
		},
	});
	expect(bySession.get(partial.id)?.nutrition).toEqual({
		status: "partial",
		estimated: true,
		caloriesKcal: 300,
		proteinG: 12,
	});
	expect(bySession.get(unavailable.id)?.nutrition).toEqual({
		status: "unavailable",
	});
});

test("active, paused, abandoned and corrupt completed sessions are ineligible", async () => {
	const uid = await user();
	for (const status of ["active", "paused", "abandoned"] as const) {
		const row = await session(uid, false);
		await db
			.update(cookingSessions)
			.set({ status, pauseReason: status === "paused" ? "user-request" : null })
			.where(eq(cookingSessions.id, row.id));
		expect(
			(await request(uid, "POST", "/favorites", { cookingSessionId: row.id }))
				.status,
		).toBe(409);
	}
	const corrupt = await session(uid);
	await db
		.update(cookingSessions)
		.set({ selectedRecipeSnapshot: sql`'{}'::jsonb` })
		.where(eq(cookingSessions.id, corrupt.id));
	expect(
		(await request(uid, "POST", "/favorites", { cookingSessionId: corrupt.id }))
			.status,
	).toBe(500);
	expect(
		await db.select().from(favorites).where(eq(favorites.userId, uid)),
	).toHaveLength(0);
});

test("ownership, missing resources, session auth and strict payloads", async () => {
	const uid = await user();
	const other = await user();
	const cooked = await session(uid);
	expect(
		(
			await request(other, "POST", "/favorites", {
				cookingSessionId: cooked.id,
			})
		).status,
	).toBe(403);
	const item = await favorite(uid, cooked.id);
	expect((await list(other)).payload).toEqual({ items: [], nextOffset: null });
	expect((await request(other, "DELETE", `/favorites/${item.id}`)).status).toBe(
		403,
	);
	expect(
		(await request(uid, "DELETE", `/favorites/${crypto.randomUUID()}`)).status,
	).toBe(404);
	expect(
		(
			await request(uid, "POST", "/favorites", {
				cookingSessionId: crypto.randomUUID(),
			})
		).status,
	).toBe(404);
	const deletedUserId = await user();
	await db.delete(users).where(eq(users.id, deletedUserId));
	expect((await request(deletedUserId)).status).toBe(401);
	expect((await app.request("/favorites")).status).toBe(401);
	for (const body of [
		{},
		{ cookingSessionId: "bad" },
		{ cookingSessionId: cooked.id, userId: other },
		{ cookingSessionId: cooked.id, recipe: {} },
	]) {
		expect((await request(uid, "POST", "/favorites", body)).status).toBe(400);
	}
});

test("deterministic saved-at ordering, filtering, and bounded pagination", async () => {
	const uid = await user();
	const first = await session(uid);
	const second = await session(uid);
	const third = await session(uid);
	const a = await favorite(uid, first.id);
	const b = await favorite(uid, second.id);
	const c = await favorite(uid, third.id);
	await db
		.update(favorites)
		.set({ createdAt: new Date("2020-01-01") })
		.where(inArray(favorites.id, [a.id, b.id]));
	await db
		.update(favorites)
		.set({ createdAt: new Date("2021-01-01") })
		.where(eq(favorites.id, c.id));
	const tiedIds = [a.id, b.id].sort().reverse();

	const firstPage = await list(uid, "?limit=2&offset=0");
	const secondPage = await list(uid, "?limit=2&offset=2");
	expect(firstPage.payload?.items.map((item) => item.id)).toEqual([
		c.id,
		tiedIds[0],
	]);
	expect(firstPage.payload?.nextOffset).toBe(2);
	expect(secondPage.payload?.items.map((item) => item.id)).toEqual([
		tiedIds[1],
	]);
	expect(secondPage.payload?.nextOffset).toBeNull();

	const filtered = await list(
		uid,
		`?limit=1&offset=0&cookingSessionId=${second.id}`,
	);
	expect(filtered.payload?.items.map((item) => item.cookingSessionId)).toEqual([
		second.id,
	]);
	expect(filtered.payload?.nextOffset).toBeNull();
	expect((await list(uid, "?limit=21")).response.status).toBe(400);

	await db.delete(cookingSessions).where(eq(cookingSessions.id, first.id));
	expect(
		await db.select().from(favorites).where(eq(favorites.id, a.id)),
	).toHaveLength(0);
});

test("OpenAPI includes authenticated Favorites operations", async () => {
	const doc = (await (await app.request("/openapi.json")).json()) as {
		paths: Record<string, Record<string, { security: unknown }>>;
	};
	for (const [path, method] of [
		["/favorites", "get"],
		["/favorites", "post"],
		["/favorites/{id}", "delete"],
	] as const) {
		expect(doc.paths[path]?.[method]?.security).toEqual([{ CurrentUser: [] }]);
	}
});
