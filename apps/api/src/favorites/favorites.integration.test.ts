import { afterAll, expect, test } from "bun:test";
import { cookingSessions, createDatabase, favorites, users } from "@flemme/db";
import { eq, inArray, sql } from "drizzle-orm";
import { createApp } from "../app";
import { createCookingSessionService } from "../cooking-session/cooking-session-service";
import {
	FavoriteResponseSchema,
	FavoritesResponseSchema,
} from "./favorites-schema";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const app = createApp({ db });
const sessionService = createCookingSessionService(db);
const ids: string[] = [];
async function user() {
	const [row] = await db
		.insert(users)
		.values({ email: `favorites-${crypto.randomUUID()}@flemme.local` })
		.returning();
	if (!row) throw new Error("Missing user");
	ids.push(row.id);
	return row.id;
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
		headers: { "x-flemme-user-id": uid, "content-type": "application/json" },
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
			summary: { title: "Historical dish", description: "Done" },
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
test("empty, create, projection, duplicate, delete and preserved completed history", async () => {
	const uid = await user();
	expect(await (await request(uid)).json()).toEqual({ items: [] });
	const cooked = await session(uid);
	const item = await favorite(uid, cooked.id);
	expect(item.cookingSessionId).toBe(cooked.id);
	expect(item.recipe).toEqual({
		name: "Historical dish",
		description: "Historical description",
		servings: 1,
		estimatedDuration: { minMinutes: 1, maxMinutes: 2 },
	});
	expect(
		FavoritesResponseSchema.parse(await (await request(uid)).json()).items,
	).toEqual([item]);
	expect(
		(await request(uid, "POST", "/favorites", { cookingSessionId: cooked.id }))
			.status,
	).toBe(409);
	expect(
		await db.select().from(favorites).where(eq(favorites.userId, uid)),
	).toHaveLength(1);
	expect((await request(uid, "DELETE", `/favorites/${item.id}`)).status).toBe(
		204,
	);
	const restored = await sessionService.get(uid, cooked.id);
	expect(restored).toEqual(cooked);
	expect(
		(
			await app.request(`/cooking-sessions/${cooked.id}`, {
				headers: { "x-flemme-user-id": uid },
			})
		).status,
	).toBe(200);
	expect(await (await request(uid)).json()).toEqual({ items: [] });
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
test("ownership, missing resources, development auth and strict payloads", async () => {
	const uid = await user(),
		other = await user();
	const cooked = await session(uid);
	expect(
		(
			await request(other, "POST", "/favorites", {
				cookingSessionId: cooked.id,
			})
		).status,
	).toBe(403);
	const item = await favorite(uid, cooked.id);
	expect(await (await request(other)).json()).toEqual({ items: [] });
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
	for (const identity of ["invalid", crypto.randomUUID()])
		expect((await request(identity)).status).toBe(401);
	expect((await app.request("/favorites")).status).toBe(401);
	for (const body of [
		{},
		{ cookingSessionId: "bad" },
		{ cookingSessionId: cooked.id, userId: other },
		{ cookingSessionId: cooked.id, recipe: {} },
	])
		expect((await request(uid, "POST", "/favorites", body)).status).toBe(400);
});
test("deterministic newest-first ordering, tie break and session cascade", async () => {
	const uid = await user();
	const first = await session(uid),
		second = await session(uid);
	const a = await favorite(uid, first.id),
		b = await favorite(uid, second.id);
	await db
		.update(favorites)
		.set({ createdAt: new Date("2020-01-01") })
		.where(eq(favorites.id, a.id));
	expect(
		FavoritesResponseSchema.parse(await (await request(uid)).json()).items.map(
			(x) => x.id,
		),
	).toEqual([b.id, a.id]);
	await db
		.update(favorites)
		.set({ createdAt: new Date("2020-01-01") })
		.where(eq(favorites.id, b.id));
	expect(
		FavoritesResponseSchema.parse(await (await request(uid)).json()).items.map(
			(x) => x.id,
		),
	).toEqual([a.id, b.id].sort().reverse());
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
	] as const)
		expect(doc.paths[path]?.[method]?.security).toEqual([
			{ DevelopmentUser: [] },
		]);
});
