import { afterAll, describe, expect, test } from "bun:test";
import { createDatabase, userProfiles, users } from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { createCookingContextService } from "../cooking/cooking-context-service";
import { ProfileResponseSchema } from "./profile-schema";

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

async function putProfile(userId: string, body: unknown) {
	return app.request("/profile", {
		method: "PUT",
		headers: headers(userId),
		body: JSON.stringify(body),
	});
}

async function getProfile(userId: string) {
	return app.request("/profile", { headers: headers(userId) });
}

afterAll(async () => {
	if (createdUserIds.length > 0) {
		await db.delete(users).where(inArray(users.id, createdUserIds));
	}

	await client.end();
});

describe("Profile API integration", () => {
	test("returns not found until PUT creates the current user's profile", async () => {
		const userId = await createUser();
		const missingResponse = await getProfile(userId);
		const missingError = ErrorResponseSchema.parse(
			await missingResponse.json(),
		);

		expect(missingResponse.status).toBe(404);
		expect(missingError.error.code).toBe("PROFILE_NOT_FOUND");

		const input = {
			foodPreferences: ["savory", "Indonesian food"],
			cookingPreferences: ["simple meals", "one wok"],
		};
		const putResponse = await putProfile(userId, input);
		const saved = ProfileResponseSchema.parse(await putResponse.json());
		const getResponse = await getProfile(userId);
		const restored = ProfileResponseSchema.parse(await getResponse.json());

		expect(putResponse.status).toBe(200);
		expect(saved).toEqual(input);
		expect(getResponse.status).toBe(200);
		expect(restored).toEqual(input);
	});

	test("PUT replaces both arrays and preserves existing non-API profile fields", async () => {
		const userId = await createUser();
		await db.insert(userProfiles).values({
			userId,
			displayName: "Existing name",
			foodPreferences: ["old food preference"],
			cookingPreferences: ["old cooking preference"],
		});

		const input = {
			foodPreferences: [],
			cookingPreferences: ["batch cooking"],
		};
		const response = await putProfile(userId, input);
		const saved = ProfileResponseSchema.parse(await response.json());
		const [row] = await db
			.select()
			.from(userProfiles)
			.where(eq(userProfiles.userId, userId));

		expect(response.status).toBe(200);
		expect(saved).toEqual(input);
		expect(row?.foodPreferences).toEqual([]);
		expect(row?.cookingPreferences).toEqual(["batch cooking"]);
		expect(row?.displayName).toBe("Existing name");
	});

	test("updated preferences feed the existing persistent cooking context", async () => {
		const userId = await createUser();
		await putProfile(userId, {
			foodPreferences: ["spicy", "vegetable-forward"],
			cookingPreferences: ["quick meals"],
		});

		const context = await createCookingContextService(db).build(userId, {
			inventory: [],
			kitchen: { equipment: [] },
			household: { adults: 1, children: 0, toddlers: 0 },
			session: { request: "Cook dinner", servings: 1 },
		});
		const overridden = await createCookingContextService(db).build(userId, {
			inventory: [],
			kitchen: { equipment: [] },
			household: { adults: 1, children: 0, toddlers: 0 },
			foodPreferences: ["override only"],
			cookingPreferences: [],
			session: { request: "Cook dinner", servings: 1 },
		});

		expect(context.foodPreferences).toEqual(["spicy", "vegetable-forward"]);
		expect(context.cookingPreferences).toEqual(["quick meals"]);
		expect(overridden.foodPreferences).toEqual(["override only"]);
		expect(overridden.cookingPreferences).toEqual([]);
	});

	test("isolates profile state by authenticated user", async () => {
		const firstUserId = await createUser();
		const secondUserId = await createUser();
		await putProfile(firstUserId, {
			foodPreferences: ["first-user-food"],
			cookingPreferences: ["first-user-cooking"],
		});
		await putProfile(secondUserId, {
			foodPreferences: ["second-user-food"],
			cookingPreferences: ["second-user-cooking"],
		});

		const first = ProfileResponseSchema.parse(
			await (await getProfile(firstUserId)).json(),
		);
		const second = ProfileResponseSchema.parse(
			await (await getProfile(secondUserId)).json(),
		);

		expect(first.foodPreferences).toEqual(["first-user-food"]);
		expect(second.foodPreferences).toEqual(["second-user-food"]);
	});

	test("rejects incomplete, empty, and unknown request fields", async () => {
		const userId = await createUser();
		const invalidBodies = [
			{ foodPreferences: [] },
			{ foodPreferences: ["   "], cookingPreferences: [] },
			{
				foodPreferences: [],
				cookingPreferences: [],
				userId: crypto.randomUUID(),
			},
		];

		for (const body of invalidBodies) {
			const response = await putProfile(userId, body);
			const error = ErrorResponseSchema.parse(await response.json());
			expect(response.status).toBe(400);
			expect(error.error.code).toBe("INVALID_REQUEST");
		}
	});

	test("rejects missing sessions and sessions for deleted users", async () => {
		const userId = await createUser();
		await db.delete(users).where(eq(users.id, userId));
		const missingSessionResponse = await app.request("/profile");
		const deletedUserResponse = await getProfile(userId);

		expect(missingSessionResponse.status).toBe(401);
		expect(
			ErrorResponseSchema.parse(await missingSessionResponse.json()).error.code,
		).toBe("UNAUTHENTICATED");
		expect(deletedUserResponse.status).toBe(401);
		expect(
			ErrorResponseSchema.parse(await deletedUserResponse.json()).error.code,
		).toBe("UNAUTHENTICATED");
	});

	test("registers GET and PUT profile operations in OpenAPI", async () => {
		const response = await app.request("/openapi.json");
		const specification = (await response.json()) as {
			paths: Record<string, { get?: unknown; put?: unknown } | undefined>;
		};

		expect(response.status).toBe(200);
		expect(specification.paths["/profile"]?.get).toBeDefined();
		expect(specification.paths["/profile"]?.put).toBeDefined();
	});
});
