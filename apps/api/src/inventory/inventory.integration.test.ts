import { afterAll, expect, test } from "bun:test";
import { createDatabase, inventories, inventoryItems, users } from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../app";
import { createCookingContextService } from "../cooking/cooking-context-service";
import { createSessionAuth } from "../test-utils/session-auth";
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
	path = "/inventory",
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
	ingredientKey: "egg",
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
	const created = await request(uid, "/inventory/items", "POST", input);
	expect(created.status).toBe(201);
	const item = InventoryItemResponseSchema.parse(await created.json());
	expect(item.name).toBe("Telur ayam");
	expect((await context(uid)).inventory).toEqual([
		{ name: "egg", quantity: "6 pcs", condition: "fresh" },
	]);
	const values = {
		quantity: 2.125,
		unit: " g ",
		condition: "use_soon",
		isApproximate: true,
	};
	const updated = await request(
		uid,
		`/inventory/items/${item.id}`,
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
		(await request(uid, `/inventory/items/${item.id}`, "DELETE")).status,
	).toBe(204);
	expect(
		InventoryResponseSchema.parse(await (await request(uid)).json()),
	).toEqual({ items: [] });
	expect((await context(uid)).inventory).toEqual([]);
});
test("canonical-only input, duplicate conflict and unknown quantities", async () => {
	const uid = await user();
	for (const ingredientKey of ["invented-food", "telur", "salt"]) {
		const r = await request(uid, "/inventory/items", "POST", {
			...input,
			ingredientKey,
		});
		expect(r.status).toBe(422);
	}
	expect(
		await db.select().from(inventories).where(eq(inventories.userId, uid)),
	).toHaveLength(0);
	const r = await request(uid, "/inventory/items", "POST", {
		ingredientKey: "egg",
		quantity: null,
		unit: null,
	});
	expect(r.status).toBe(201);
	const item = InventoryItemResponseSchema.parse(await r.json());
	expect(item.condition).toBe("unknown");
	expect(item.isApproximate).toBe(false);
	expect((await request(uid, "/inventory/items", "POST", input)).status).toBe(
		409,
	);
});
test("ownership, identity and malformed payload rejection", async () => {
	const uid = await user(),
		other = await user();
	const item = InventoryItemResponseSchema.parse(
		await (await request(uid, "/inventory/items", "POST", input)).json(),
	);
	for (const method of ["PUT", "DELETE"]) {
		expect(
			(
				await request(
					other,
					`/inventory/items/${item.id}`,
					method,
					method === "PUT"
						? {
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
		(await request(other, `/inventory/items/${crypto.randomUUID()}`, "DELETE"))
			.status,
	).toBe(404);
	const deletedUserId = await user();
	await db.delete(users).where(eq(users.id, deletedUserId));
	expect((await request(deletedUserId)).status).toBe(401);
	expect((await app.request("/inventory")).status).toBe(401);
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
		expect((await request(uid, "/inventory/items", "POST", body)).status).toBe(
			400,
		);
	}
	expect(
		(await request(uid, `/inventory/items/${item.id}`, "PUT", input)).status,
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
	await db
		.insert(inventoryItems)
		.values({ inventoryId: inv.id, ingredientKey: "salt" });
	const result = InventoryResponseSchema.parse(
		await (await request(uid)).json(),
	);
	expect(result.items[0]?.ingredientKey).toBe("salt");
	expect(result.items[0]?.name).toBe("salt");
});
test("OpenAPI inventory operations", async () => {
	const document = (await (await app.request("/openapi.json")).json()) as {
		paths: Record<string, Record<string, unknown>>;
	};
	expect(document.paths["/inventory"]?.get).toBeDefined();
	expect(document.paths["/inventory/items"]?.post).toBeDefined();
	expect(document.paths["/inventory/items/{id}"]?.put).toBeDefined();
	expect(document.paths["/inventory/items/{id}"]?.delete).toBeDefined();
});
