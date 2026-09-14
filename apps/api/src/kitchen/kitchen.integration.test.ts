import { afterAll, describe, expect, test } from "bun:test";
import { createDatabase, kitchenEquipment, kitchens, users } from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../app";
import { createCookingContextService } from "../cooking/cooking-context-service";
import { createSessionAuth } from "../test-utils/session-auth";
import { KitchenResponseSchema } from "./kitchen-schema";
import { createKitchenService } from "./kitchen-service";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

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
const createdUserIds: string[] = [];

async function createUser() {
	const userId = await createAuthenticatedUser();
	createdUserIds.push(userId);
	return userId;
}

async function putKitchen(userId: string, body: unknown) {
	return app.request("/kitchen", {
		method: "PUT",
		headers: headers(userId),
		body: JSON.stringify(body),
	});
}

async function getKitchen(userId: string) {
	return app.request("/kitchen", { headers: headers(userId) });
}

afterAll(async () => {
	if (createdUserIds.length > 0) {
		await db.delete(users).where(inArray(users.id, createdUserIds));
	}

	await client.end();
});

describe("Kitchen API integration", () => {
	test("returns not found until PUT creates normalized equipment", async () => {
		const userId = await createUser();
		const missingResponse = await getKitchen(userId);
		const missingError = ErrorResponseSchema.parse(
			await missingResponse.json(),
		);

		expect(missingResponse.status).toBe(404);
		expect(missingError.error.code).toBe("KITCHEN_NOT_FOUND");

		const putResponse = await putKitchen(userId, {
			equipment: [" Wajan ", "kompor", " Spatula"],
		});
		const saved = KitchenResponseSchema.parse(await putResponse.json());
		const getResponse = await getKitchen(userId);
		const restored = KitchenResponseSchema.parse(await getResponse.json());

		expect(putResponse.status).toBe(200);
		expect(saved.equipment).toEqual(["kompor", "Spatula", "Wajan"]);
		expect(getResponse.status).toBe(200);
		expect(restored).toEqual(saved);
	});

	test("PUT fully replaces equipment without duplicating the Kitchen", async () => {
		const userId = await createUser();
		await putKitchen(userId, { equipment: ["kompor", "wajan", "blender"] });
		const [before] = await db
			.select({ id: kitchens.id })
			.from(kitchens)
			.where(eq(kitchens.userId, userId));

		const response = await putKitchen(userId, { equipment: ["wajan"] });
		const saved = KitchenResponseSchema.parse(await response.json());
		const kitchenRows = await db
			.select()
			.from(kitchens)
			.where(eq(kitchens.userId, userId));
		const equipmentRows = before
			? await db
					.select({ name: kitchenEquipment.name })
					.from(kitchenEquipment)
					.where(eq(kitchenEquipment.kitchenId, before.id))
			: [];

		expect(response.status).toBe(200);
		expect(saved).toEqual({ equipment: ["wajan"] });
		expect(kitchenRows).toHaveLength(1);
		expect(kitchenRows[0]?.id).toBe(before?.id);
		expect(equipmentRows).toEqual([{ name: "wajan" }]);
	});

	test("accepts and persists an empty equipment list", async () => {
		const userId = await createUser();
		await putKitchen(userId, { equipment: ["oven"] });
		const response = await putKitchen(userId, { equipment: [] });
		const saved = KitchenResponseSchema.parse(await response.json());
		const restored = KitchenResponseSchema.parse(
			await (await getKitchen(userId)).json(),
		);

		expect(response.status).toBe(200);
		expect(saved).toEqual({ equipment: [] });
		expect(restored).toEqual({ equipment: [] });
	});

	test("rejects duplicate and invalid equipment without changing saved state", async () => {
		const userId = await createUser();
		await putKitchen(userId, { equipment: ["wajan"] });
		const invalidBodies = [
			{ equipment: ["wajan", "Wajan"] },
			{ equipment: ["   "] },
			{ equipment: ["wajan"], userId: crypto.randomUUID() },
			{},
		];

		for (const body of invalidBodies) {
			const response = await putKitchen(userId, body);
			const error = ErrorResponseSchema.parse(await response.json());
			expect(response.status).toBe(400);
			expect(error.error.code).toBe("INVALID_REQUEST");
		}

		expect(
			KitchenResponseSchema.parse(await (await getKitchen(userId)).json()),
		).toEqual({ equipment: ["wajan"] });
	});

	test("rolls back replacement when a child insert fails", async () => {
		const userId = await createUser();
		const service = createKitchenService(db);
		await service.put(userId, { equipment: ["kompor", "wajan"] });

		await expect(
			service.put(userId, { equipment: ["duplicate", "duplicate"] }),
		).rejects.toThrow();

		expect(await service.get(userId)).toEqual({
			equipment: ["kompor", "wajan"],
		});
	});

	test("feeds persisted equipment to cooking context and preserves overrides", async () => {
		const userId = await createUser();
		await putKitchen(userId, {
			equipment: ["kompor", "wajan", "blender"],
		});
		const service = createCookingContextService(db);
		const context = await service.build(userId, {
			inventory: [],
			household: { adults: 1, children: 0, toddlers: 0 },
			session: { request: "Cook dinner", servings: 1 },
		});
		const overridden = await service.build(userId, {
			inventory: [],
			kitchen: { equipment: ["wajan"] },
			household: { adults: 1, children: 0, toddlers: 0 },
			session: { request: "Cook dinner", servings: 1 },
		});

		expect(context.kitchen.equipment).toEqual(
			expect.arrayContaining(["kompor", "wajan", "blender"]),
		);
		expect(context.kitchen.equipment).toHaveLength(3);
		expect(overridden.kitchen.equipment).toEqual(["wajan"]);
	});

	test("isolates Kitchen state by authenticated user", async () => {
		const firstUserId = await createUser();
		const secondUserId = await createUser();
		await putKitchen(firstUserId, { equipment: ["oven"] });
		await putKitchen(secondUserId, { equipment: ["air fryer"] });

		const first = KitchenResponseSchema.parse(
			await (await getKitchen(firstUserId)).json(),
		);
		const second = KitchenResponseSchema.parse(
			await (await getKitchen(secondUserId)).json(),
		);

		expect(first).toEqual({ equipment: ["oven"] });
		expect(second).toEqual({ equipment: ["air fryer"] });
	});

	test("rejects missing sessions and sessions for deleted users", async () => {
		const userId = await createUser();
		await db.delete(users).where(eq(users.id, userId));
		const missingSessionResponse = await app.request("/kitchen");
		const deletedUserResponse = await getKitchen(userId);

		expect(missingSessionResponse.status).toBe(401);
		expect(
			ErrorResponseSchema.parse(await missingSessionResponse.json()).error.code,
		).toBe("UNAUTHENTICATED");
		expect(deletedUserResponse.status).toBe(401);
		expect(
			ErrorResponseSchema.parse(await deletedUserResponse.json()).error.code,
		).toBe("UNAUTHENTICATED");
	});

	test("registers GET and PUT Kitchen operations in OpenAPI", async () => {
		const response = await app.request("/openapi.json");
		const specification = (await response.json()) as {
			paths: Record<string, { get?: unknown; put?: unknown } | undefined>;
		};

		expect(response.status).toBe(200);
		expect(specification.paths["/kitchen"]?.get).toBeDefined();
		expect(specification.paths["/kitchen"]?.put).toBeDefined();
	});
});
