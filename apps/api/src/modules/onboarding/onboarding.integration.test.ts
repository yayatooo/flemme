import { afterAll, describe, expect, test } from "bun:test";
import {
	createDatabase,
	households,
	inventories,
	kitchens,
	userProfiles,
	users,
} from "@flemme/db";
import { eq, inArray } from "drizzle-orm";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import { OnboardingStatusResponseSchema } from "./onboarding-schema";

const databaseUrl = Bun.env.DATABASE_URL;
if (!databaseUrl)
	throw new Error("DATABASE_URL is required for API integration tests");

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

async function createRequiredContext(userId: string, includeInventory = true) {
	await db.insert(userProfiles).values({ userId });
	await db.insert(households).values({ userId, adults: 1 });
	await db.insert(kitchens).values({ userId });
	if (includeInventory) await db.insert(inventories).values({ userId });
}

afterAll(async () => {
	if (createdUserIds.length > 0) {
		await db.delete(users).where(inArray(users.id, createdUserIds));
	}
	await client.end();
});

describe("Onboarding API integration", () => {
	test("reports and rejects the first incomplete required step", async () => {
		const userId = await createUser();
		await db.insert(userProfiles).values({ userId });
		const statusResponse = await app.request("/api/onboarding", {
			headers: headers(userId),
		});
		const status = OnboardingStatusResponseSchema.parse(
			await statusResponse.json(),
		);
		const completionResponse = await app.request("/api/onboarding/complete", {
			method: "POST",
			headers: headers(userId),
		});

		expect(status).toEqual({
			completed: false,
			completedAt: null,
			nextStep: "household",
		});
		expect(completionResponse.status).toBe(409);
		expect(await completionResponse.json()).toMatchObject({
			error: { code: "ONBOARDING_INCOMPLETE" },
		});
	});

	test("accepts an empty Inventory decision and persists completion idempotently", async () => {
		const userId = await createUser();
		await createRequiredContext(userId);
		const ready = OnboardingStatusResponseSchema.parse(
			await (
				await app.request("/api/onboarding", { headers: headers(userId) })
			).json(),
		);
		const first = OnboardingStatusResponseSchema.parse(
			await (
				await app.request("/api/onboarding/complete", {
					method: "POST",
					headers: headers(userId),
				})
			).json(),
		);
		const second = OnboardingStatusResponseSchema.parse(
			await (
				await app.request("/api/onboarding/complete", {
					method: "POST",
					headers: headers(userId),
				})
			).json(),
		);
		const [persisted] = await db
			.select({ completedAt: users.onboardingCompletedAt })
			.from(users)
			.where(eq(users.id, userId));

		expect(ready).toEqual({
			completed: false,
			completedAt: null,
			nextStep: "complete",
		});
		expect(first.completed).toBe(true);
		expect(first.nextStep).toBeNull();
		expect(second).toEqual(first);
		expect(persisted?.completedAt?.toISOString() ?? null).toEqual(
			first.completedAt,
		);
	});

	test("isolates canonical completion state by authenticated user", async () => {
		const completedUserId = await createUser();
		const otherUserId = await createUser();
		await createRequiredContext(completedUserId);
		await createRequiredContext(otherUserId, false);
		await app.request("/api/onboarding/complete", {
			method: "POST",
			headers: headers(completedUserId),
		});

		const completed = OnboardingStatusResponseSchema.parse(
			await (
				await app.request("/api/onboarding", {
					headers: headers(completedUserId),
				})
			).json(),
		);
		const other = OnboardingStatusResponseSchema.parse(
			await (
				await app.request("/api/onboarding", { headers: headers(otherUserId) })
			).json(),
		);

		expect(completed.completed).toBe(true);
		expect(other).toEqual({
			completed: false,
			completedAt: null,
			nextStep: "inventory",
		});
	});

	test("requires authentication and publishes both operations", async () => {
		expect((await app.request("/api/onboarding")).status).toBe(401);
		expect(
			(await app.request("/api/onboarding/complete", { method: "POST" }))
				.status,
		).toBe(401);
		const specification = (await (
			await app.request("/api/openapi.json")
		).json()) as { paths: Record<string, unknown> };
		expect(specification.paths["/api/onboarding"]).toBeDefined();
		expect(specification.paths["/api/onboarding/complete"]).toBeDefined();
	});
});
