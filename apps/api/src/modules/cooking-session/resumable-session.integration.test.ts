import { afterAll, expect, test } from "bun:test";
import {
	CookingSessionResponseSchema,
	ResumableCookingSessionResponseSchema,
} from "@flemme/contracts/cooking-session";
import { cookingSessions, createDatabase, users } from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");

const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers,
} = createSessionAuth(db);
const app = createApp({ authFoundation, db });
const userIds: string[] = [];

const recipe = {
	name: "Resumable test dish",
	description: "Persisted continuity fixture.",
	reason: "Test resumable session behavior.",
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

async function user() {
	const userId = await createAuthenticatedUser();
	userIds.push(userId);
	return userId;
}

async function createSession(userId: string) {
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
				preparationSummary: { overview: "Prepare the fixture." },
				ingredients: [],
				equipment: [],
				preparationSteps: [],
				cookingStages: [
					{
						id: "cook-stage",
						title: "Cook the fixture",
						steps: [{ id: "finish-step", instruction: "Finish the fixture." }],
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

async function getResumable(userId: string) {
	const response = await app.request("/cooking-sessions/resumable", {
		headers: headers(userId),
	});
	return {
		response,
		payload:
			response.status === 200
				? ResumableCookingSessionResponseSchema.parse(await response.json())
				: null,
	};
}

async function updateProgress(
	userId: string,
	sessionId: string,
	session: Record<string, unknown>,
) {
	return app.request(`/cooking-sessions/${sessionId}/progress`, {
		method: "PATCH",
		headers: headers(userId),
		body: JSON.stringify({ session }),
	});
}

afterAll(async () => {
	if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
	await client.end();
});

test("no resumable Cooking Session returns null", async () => {
	const userId = await user();
	const { response, payload } = await getResumable(userId);

	expect(response.status).toBe(200);
	expect(payload).toEqual({ session: null });
});

test("returns only the authenticated user's active session with display data intact", async () => {
	const ownerId = await user();
	const otherId = await user();
	const owned = await createSession(ownerId);
	await createSession(otherId);
	await app.request(`/cooking-sessions/${owned.id}`, {
		method: "PATCH",
		headers: headers(ownerId),
		body: JSON.stringify({ customName: "My resumable supper" }),
	});

	const { payload } = await getResumable(ownerId);
	expect(payload?.session?.id).toBe(owned.id);
	expect(payload?.session?.customName).toBe("My resumable supper");
	expect(payload?.session?.selectedRecipeSnapshot).toEqual(recipe);
	expect(payload?.session?.session.currentStageId).toBe("cook-stage");
	expect(payload?.session?.session.currentStepId).toBe("finish-step");
});

test("returns a paused session without implicitly resuming it", async () => {
	const userId = await user();
	const created = await createSession(userId);
	const pauseResponse = await updateProgress(userId, created.id, {
		...created.session,
		status: "paused",
		pauseReason: "interruption",
	});
	const { payload } = await getResumable(userId);
	const restoredResponse = await app.request(
		`/cooking-sessions/${created.id}`,
		{
			headers: headers(userId),
		},
	);
	const restored = CookingSessionResponseSchema.parse(
		await restoredResponse.json(),
	);

	expect(pauseResponse.status).toBe(200);
	expect(payload?.session?.session.status).toBe("paused");
	expect(payload?.session?.session.pauseReason).toBe("interruption");
	expect(restored.session.status).toBe("paused");
});

test("completed and abandoned sessions are not resumable", async () => {
	const completedUserId = await user();
	const completed = await createSession(completedUserId);
	const completionResponse = await updateProgress(
		completedUserId,
		completed.id,
		{
			...completed.session,
			status: "completed",
			completedStepIds: ["finish-step"],
		},
	);

	const abandonedUserId = await user();
	const abandoned = await createSession(abandonedUserId);
	const abandonResponse = await updateProgress(abandonedUserId, abandoned.id, {
		...abandoned.session,
		status: "abandoned",
	});

	expect(completionResponse.status).toBe(200);
	expect((await getResumable(completedUserId)).payload).toEqual({
		session: null,
	});
	expect(abandonResponse.status).toBe(200);
	expect((await getResumable(abandonedUserId)).payload).toEqual({
		session: null,
	});
});

test("multiple resumable sessions resolve deterministically on the server", async () => {
	const userId = await user();
	const older = await createSession(userId);
	const newer = await createSession(userId);
	await db
		.update(cookingSessions)
		.set({ updatedAt: new Date("2026-01-01T00:00:00.000Z") })
		.where(eq(cookingSessions.id, older.id));
	await db
		.update(cookingSessions)
		.set({
			status: "paused",
			pauseReason: "user-request",
			updatedAt: new Date("2026-01-02T00:00:00.000Z"),
		})
		.where(eq(cookingSessions.id, newer.id));

	const { payload } = await getResumable(userId);
	expect(payload?.session?.id).toBe(newer.id);
	expect(payload?.session?.session.status).toBe("paused");
});
