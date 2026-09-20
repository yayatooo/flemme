import { afterAll, expect, test } from "bun:test";
import { createDatabase, inventories, inventoryItems, users } from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { createCookingContextService } from "../cooking/cooking-context-service";
import { createCookingSessionService } from "../cooking-session/cooking-session-service";
import {
	InventoryItemResponseSchema,
	InventoryResponseSchema,
} from "./inventory-schema";
import { createInventoryService } from "./inventory-service";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers,
} = createSessionAuth(db);
const app = createApp({ authFoundation, db });
const ids: string[] = [];
async function user() {
	const userId = await createAuthenticatedUser();
	ids.push(userId);
	return userId;
}
async function request(
	uid: string,
	path = "/api/inventory",
	method = "GET",
	body?: unknown,
) {
	return app.request(path, {
		method,
		headers: headers(uid),
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
}
const input = {
	name: "Egg",
	quantity: 6,
	unit: "pcs",
	isApproximate: false,
	condition: "fresh" as const,
};
const context = (uid: string) =>
	createCookingContextService(db).build(uid, {
		kitchen: { equipment: [] },
		household: { adults: 1, children: 0, toddlers: 0 },
		session: {},
	});
afterAll(async () => {
	if (ids.length) await db.delete(users).where(inArray(users.id, ids));
	await client.end();
});
test("inventory lifecycle, missing versus empty and cooking context visibility", async () => {
	const uid = await user();
	expect((await request(uid)).status).toBe(404);
	expect(
		await db.select().from(inventories).where(eq(inventories.userId, uid)),
	).toHaveLength(0);
	const created = await request(uid, "/api/inventory/items", "POST", input);
	expect(created.status).toBe(201);
	const item = InventoryItemResponseSchema.parse(await created.json());
	expect(item.name).toBe("Egg");
	expect((await context(uid)).inventory).toEqual([
		{ name: "egg", quantity: "6 pcs", condition: "fresh" },
	]);
	const values = {
		quantity: 2.125,
		unit: " g ",
		condition: "use_soon",
		isApproximate: true,
		name: item.name,
	};
	const updated = await request(
		uid,
		`/api/inventory/items/${item.id}`,
		"PUT",
		values,
	);
	expect(updated.status).toBe(200);
	expect(InventoryItemResponseSchema.parse(await updated.json()).unit).toBe(
		"g",
	);
	expect((await context(uid)).inventory).toEqual([
		{ name: "egg", quantity: "approximately 2.125 g", condition: "use_soon" },
	]);
	const overridden = await createCookingContextService(db).build(uid, {
		kitchen: { equipment: [] },
		household: { adults: 1, children: 0, toddlers: 0 },
		inventory: [],
		session: {},
	});
	expect(overridden.inventory).toEqual([]);
	expect(
		InventoryResponseSchema.parse(await (await request(uid)).json()).items,
	).toHaveLength(1);
	expect(
		(await request(uid, `/api/inventory/items/${item.id}`, "DELETE")).status,
	).toBe(204);
	expect(
		InventoryResponseSchema.parse(await (await request(uid)).json()),
	).toEqual({ items: [] });
	expect((await context(uid)).inventory).toEqual([]);
});
test("PUT /inventory initializes and returns existing inventory state", async () => {
	const uid = await user();
	expect((await request(uid)).status).toBe(404);
	expect(
		await db.select().from(inventories).where(eq(inventories.userId, uid)),
	).toHaveLength(0);

	const first = await request(uid, "/api/inventory", "PUT");
	expect(first.status).toBe(200);
	expect(InventoryResponseSchema.parse(await first.json())).toEqual({
		items: [],
	});
	expect(
		InventoryResponseSchema.parse(await (await request(uid)).json()),
	).toEqual({ items: [] });
	expect(
		await db.select().from(inventories).where(eq(inventories.userId, uid)),
	).toHaveLength(1);

	const second = await request(uid, "/api/inventory", "PUT");
	expect(second.status).toBe(200);
	expect(InventoryResponseSchema.parse(await second.json())).toEqual({
		items: [],
	});
	expect(
		await db.select().from(inventories).where(eq(inventories.userId, uid)),
	).toHaveLength(1);

	const created = await request(uid, "/api/inventory/items", "POST", input);
	expect(created.status).toBe(201);
	const item = InventoryItemResponseSchema.parse(await created.json());
	const repeated = await request(uid, "/api/inventory", "PUT");
	expect(repeated.status).toBe(200);
	expect(InventoryResponseSchema.parse(await repeated.json()).items).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				id: item.id,
				ingredientKey: item.ingredientKey,
			}),
		]),
	);
});

test("resolved, unresolved, name-only and duplicate inventory creation", async () => {
	const uid = await user();
	const resolved = await request(uid, "/api/inventory/items", "POST", {
		name: "Telur",
		quantity: null,
		unit: null,
	});
	expect(resolved.status).toBe(201);
	expect(
		InventoryItemResponseSchema.parse(await resolved.json()),
	).toMatchObject({
		name: "Telur",
		ingredientKey: "egg",
		quantity: null,
		unit: null,
	});
	expect(
		(
			await request(uid, "/api/inventory/items", "POST", {
				name: "egg",
			})
		).status,
	).toBe(409);

	const unresolved = await request(uid, "/api/inventory/items", "POST", {
		name: "  Daun   Gedi ",
		quantity: 2,
		unit: "bunches",
	});
	expect(unresolved.status).toBe(201);
	expect(
		InventoryItemResponseSchema.parse(await unresolved.json()),
	).toMatchObject({
		name: "Daun Gedi",
		ingredientKey: null,
		quantity: 2,
		unit: "bunches",
	});
	expect(
		(
			await request(uid, "/api/inventory/items", "POST", {
				name: "daun gedi",
			})
		).status,
	).toBe(409);
});
test("editing names reruns resolution and controls duplicate identities", async () => {
	const uid = await user();
	const unresolved = InventoryItemResponseSchema.parse(
		await (
			await request(uid, "/api/inventory/items", "POST", {
				name: "Daun gedi",
				quantity: 2,
				unit: "bunches",
			})
		).json(),
	);
	const renamed = await request(
		uid,
		`/api/inventory/items/${unresolved.id}`,
		"PUT",
		{
			name: "Tomat",
			quantity: null,
			unit: null,
			isApproximate: false,
			condition: "fresh",
		},
	);
	expect(renamed.status).toBe(200);
	expect(InventoryItemResponseSchema.parse(await renamed.json())).toMatchObject(
		{
			name: "Tomat",
			ingredientKey: "tomato",
			quantity: null,
			unit: null,
		},
	);

	const garlic = InventoryItemResponseSchema.parse(
		await (
			await request(uid, "/api/inventory/items", "POST", { name: "Garlic" })
		).json(),
	);
	expect(
		(
			await request(uid, `/api/inventory/items/${garlic.id}`, "PUT", {
				name: "tomato",
				quantity: null,
				unit: null,
				isApproximate: false,
				condition: "unknown",
			})
		).status,
	).toBe(409);
	const current = InventoryResponseSchema.parse(
		await (await request(uid)).json(),
	);
	expect(current.items.find(({ id }) => id === garlic.id)?.ingredientKey).toBe(
		"garlic",
	);
});
test("ownership, identity and malformed payload rejection", async () => {
	const uid = await user(),
		other = await user();
	const item = InventoryItemResponseSchema.parse(
		await (await request(uid, "/api/inventory/items", "POST", input)).json(),
	);
	for (const method of ["PUT", "DELETE"]) {
		expect(
			(
				await request(
					other,
					`/api/inventory/items/${item.id}`,
					method,
					method === "PUT"
						? {
								name: item.name,
								quantity: null,
								unit: null,
								isApproximate: false,
								condition: "unknown",
							}
						: undefined,
				)
			).status,
		).toBe(403);
	}
	expect(
		(
			await request(
				other,
				`/api/inventory/items/${crypto.randomUUID()}`,
				"DELETE",
			)
		).status,
	).toBe(404);
	const deletedUserId = await user();
	await db.delete(users).where(eq(users.id, deletedUserId));
	expect((await request(deletedUserId)).status).toBe(401);
	expect((await app.request("/api/inventory")).status).toBe(401);
	expect((await app.request("/api/inventory", { method: "PUT" })).status).toBe(
		401,
	);
	for (const body of [
		{ ...input, quantity: 0 },
		{ ...input, quantity: -1 },
		{ ...input, quantity: 0.0001 },
		{ ...input, quantity: 100_000_000_000 },
		{ ...input, unit: null },
		{ ...input, unit: " " },
		{ ...input, condition: "expired" },
		{ ...input, userId: other },
	]) {
		expect(
			(await request(uid, "/api/inventory/items", "POST", body)).status,
		).toBe(400);
	}
	expect(
		(
			await request(uid, `/api/inventory/items/${item.id}`, "PUT", {
				...input,
				ingredientKey: "egg",
			})
		).status,
	).toBe(400);
});
test("multi-statement creation rolls back parent on item failure", async () => {
	const uid = await user();
	await expect(
		createInventoryService(db).create(uid, { ...input, quantity: -1 }),
	).rejects.toThrow();
	expect(
		await db.select().from(inventories).where(eq(inventories.userId, uid)),
	).toHaveLength(0);
});
test("legacy keys remain readable without alias remapping", async () => {
	const uid = await user();
	const [inv] = await db
		.insert(inventories)
		.values({ userId: uid })
		.returning();
	if (!inv) throw new Error("Missing inventory");
	await db.insert(inventoryItems).values({
		inventoryId: inv.id,
		identityKey: "salt",
		ingredientKey: "salt",
		name: "salt",
	});
	const result = InventoryResponseSchema.parse(
		await (await request(uid)).json(),
	);
	expect(result.items[0]?.ingredientKey).toBe("salt");
	expect(result.items[0]?.name).toBe("salt");
});
test("onboarding replacement resolves known names and preserves unknown names", async () => {
	const uid = await user();
	const response = await request(uid, "/api/inventory/items", "PUT", {
		items: [
			{ name: "Telur" },
			{ name: "egg" },
			{ name: "  DAUN   GEDI " },
			{ name: "daun gedi" },
			{ name: "Garlic" },
		],
	});
	const saved = InventoryResponseSchema.parse(await response.json());

	expect(response.status).toBe(200);
	expect(saved.items).toHaveLength(3);
	expect(saved.items).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				ingredientKey: "egg",
				name: "Telur",
				quantity: null,
			}),
			expect.objectContaining({
				ingredientKey: "garlic",
				name: "Garlic",
				quantity: null,
			}),
			expect.objectContaining({
				ingredientKey: null,
				name: "DAUN GEDI",
				quantity: null,
			}),
		]),
	);

	expect((await context(uid)).inventory).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ name: "egg" }),
			expect.objectContaining({ name: "garlic" }),
			expect.objectContaining({ name: "DAUN GEDI" }),
		]),
	);

	const cleared = await request(uid, "/api/inventory/items", "PUT", {
		items: [],
	});
	expect(cleared.status).toBe(200);
	expect(InventoryResponseSchema.parse(await cleared.json())).toEqual({
		items: [],
	});
	expect((await context(uid)).inventory).toEqual([]);
});
test("Inventory mutations do not rewrite an existing Cooking Session plan", async () => {
	const uid = await user();
	const inventoryItem = InventoryItemResponseSchema.parse(
		await (await request(uid, "/api/inventory/items", "POST", input)).json(),
	);
	const recipe = {
		name: "Inventory isolation dish",
		description: "A persisted plan that must not change",
		reason: "Test",
		estimatedDuration: { minMinutes: 10, maxMinutes: 15 },
		servings: 1,
		feasibility: "ready" as const,
		ingredients: [],
		equipment: [],
		preferenceMatches: [],
		requiredConfirmations: [],
		optionalIngredients: [],
		warnings: [],
	};
	const service = createCookingSessionService(db);
	const session = await service.create(uid, {
		recommendationSnapshot: {
			type: "recommendations",
			recommendations: [recipe],
		},
		selectedRecipeSnapshot: recipe,
		cookingPlan: {
			preparationSummary: { overview: "Use the saved egg." },
			ingredients: [{ name: "egg", quantity: 1, unit: "pcs" }],
			equipment: [],
			preparationSteps: [],
			cookingStages: [
				{
					id: "cook",
					title: "Cook",
					steps: [{ id: "finish", instruction: "Cook the egg." }],
				},
			],
		},
		session: {
			status: "active",
			currentStageId: "cook",
			currentStepId: "finish",
			completedStepIds: [],
			changes: [],
		},
	});

	expect(
		(
			await request(uid, `/api/inventory/items/${inventoryItem.id}`, "PUT", {
				...input,
				name: "Beras",
			})
		).status,
	).toBe(200);
	expect(
		(await request(uid, `/api/inventory/items/${inventoryItem.id}`, "DELETE"))
			.status,
	).toBe(204);
	const restored = await service.get(uid, session.id);
	expect(restored.cookingPlan).toEqual(session.cookingPlan);
	expect(restored.cookingPlan.ingredients).toEqual([
		{ name: "egg", quantity: 1, unit: "pcs" },
	]);
});

test("OpenAPI inventory operations", async () => {
	const document = (await (await app.request("/api/openapi.json")).json()) as {
		paths: Record<string, Record<string, unknown>>;
	};
	expect(document.paths["/api/inventory"]?.get).toBeDefined();
	expect(document.paths["/api/inventory"]?.put).toBeDefined();
	expect(document.paths["/api/inventory/items"]?.post).toBeDefined();
	expect(document.paths["/api/inventory/items"]?.put).toBeDefined();
	expect(document.paths["/api/inventory/items/{id}"]?.put).toBeDefined();
	expect(document.paths["/api/inventory/items/{id}"]?.delete).toBeDefined();
});
