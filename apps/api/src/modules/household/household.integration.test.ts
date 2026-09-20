import { afterAll, describe, expect, test } from "bun:test";
import { createDatabase, households, users } from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { createCookingContextService } from "../cooking/cooking-context-service";
import { HouseholdResponseSchema } from "./household-schema";

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

async function putHousehold(userId: string, body: unknown) {
	return app.request("/api/household", {
		method: "PUT",
		headers: headers(userId),
		body: JSON.stringify(body),
	});
}

async function getHousehold(userId: string) {
	return app.request("/api/household", { headers: headers(userId) });
}

afterAll(async () => {
	if (createdUserIds.length > 0) {
		await db.delete(users).where(inArray(users.id, createdUserIds));
	}

	await client.end();
});

describe("Household API integration", () => {
	test("returns not found until PUT creates the current user's household", async () => {
		const userId = await createUser();
		const missingResponse = await getHousehold(userId);
		const missingError = ErrorResponseSchema.parse(
			await missingResponse.json(),
		);

		expect(missingResponse.status).toBe(404);
		expect(missingError.error.code).toBe("HOUSEHOLD_NOT_FOUND");

		const input = { adults: 2, children: 1, toddlers: 1 };
		const putResponse = await putHousehold(userId, input);
		const saved = HouseholdResponseSchema.parse(await putResponse.json());
		const getResponse = await getHousehold(userId);
		const restored = HouseholdResponseSchema.parse(await getResponse.json());

		expect(putResponse.status).toBe(200);
		expect(saved).toEqual(input);
		expect(getResponse.status).toBe(200);
		expect(restored).toEqual(input);
	});

	test("PUT updates one existing household row without duplication", async () => {
		const userId = await createUser();
		await putHousehold(userId, { adults: 1, children: 0, toddlers: 0 });
		const [before] = await db
			.select({ id: households.id })
			.from(households)
			.where(eq(households.userId, userId));

		const input = { adults: 3, children: 2, toddlers: 1 };
		const response = await putHousehold(userId, input);
		const saved = HouseholdResponseSchema.parse(await response.json());
		const rows = await db
			.select()
			.from(households)
			.where(eq(households.userId, userId));

		expect(response.status).toBe(200);
		expect(saved).toEqual(input);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe(before?.id);
	});

	test("rejects a household with no members", async () => {
		const userId = await createUser();
		const response = await putHousehold(userId, {
			adults: 0,
			children: 0,
			toddlers: 0,
		});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(400);
		expect(error.error.code).toBe("INVALID_REQUEST");
	});

	test("updated counts feed cooking context while request overrides still replace", async () => {
		const userId = await createUser();
		await putHousehold(userId, { adults: 2, children: 3, toddlers: 1 });
		const service = createCookingContextService(db);
		const context = await service.build(userId, {
			inventory: [],
			kitchen: { equipment: [] },
			session: { request: "Cook dinner", servings: 6 },
		});
		const overridden = await service.build(userId, {
			inventory: [],
			kitchen: { equipment: [] },
			household: { adults: 1, children: 0, toddlers: 0 },
			session: { request: "Cook dinner", servings: 1 },
		});

		expect(context.household).toEqual({
			adults: 2,
			children: 3,
			toddlers: 1,
		});
		expect(overridden.household).toEqual({
			adults: 1,
			children: 0,
			toddlers: 0,
		});
	});

	test("isolates household state by authenticated user", async () => {
		const firstUserId = await createUser();
		const secondUserId = await createUser();
		await putHousehold(firstUserId, { adults: 1, children: 2, toddlers: 3 });
		await putHousehold(secondUserId, { adults: 4, children: 5, toddlers: 6 });

		const first = HouseholdResponseSchema.parse(
			await (await getHousehold(firstUserId)).json(),
		);
		const second = HouseholdResponseSchema.parse(
			await (await getHousehold(secondUserId)).json(),
		);

		expect(first).toEqual({ adults: 1, children: 2, toddlers: 3 });
		expect(second).toEqual({ adults: 4, children: 5, toddlers: 6 });
	});

	test("rejects invalid household payloads", async () => {
		const userId = await createUser();
		const invalidBodies = [
			{ adults: -1, children: 0, toddlers: 0 },
			{ adults: 1, children: 0.5, toddlers: 0 },
			{ adults: 21, children: 0, toddlers: 0 },
			{ adults: 1, children: 0 },
			{ adults: 1, children: 0, toddlers: 0, userId: crypto.randomUUID() },
		];

		for (const body of invalidBodies) {
			const response = await putHousehold(userId, body);
			const error = ErrorResponseSchema.parse(await response.json());
			expect(response.status).toBe(400);
			expect(error.error.code).toBe("INVALID_REQUEST");
		}
	});

	test("rejects missing sessions and sessions for deleted users", async () => {
		const userId = await createUser();
		await db.delete(users).where(eq(users.id, userId));
		const missingSessionResponse = await app.request("/api/household");
		const deletedUserResponse = await getHousehold(userId);

		expect(missingSessionResponse.status).toBe(401);
		expect(
			ErrorResponseSchema.parse(await missingSessionResponse.json()).error.code,
		).toBe("UNAUTHENTICATED");
		expect(deletedUserResponse.status).toBe(401);
		expect(
			ErrorResponseSchema.parse(await deletedUserResponse.json()).error.code,
		).toBe("UNAUTHENTICATED");
	});

	test("registers GET and PUT household operations in OpenAPI", async () => {
		const response = await app.request("/api/openapi.json");
		const specification = (await response.json()) as {
			paths: Record<string, { get?: unknown; put?: unknown } | undefined>;
		};

		expect(response.status).toBe(200);
		expect(specification.paths["/api/household"]?.get).toBeDefined();
		expect(specification.paths["/api/household"]?.put).toBeDefined();
	});
});
