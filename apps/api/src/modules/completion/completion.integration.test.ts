import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	CompletionInput,
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import { cookingSessions, createDatabase, users } from "@flemme/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import {
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
} from "../cooking-session/cooking-session-schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

const selectedRecipe: CookingRecommendation = {
	name: "Completion Test Dish",
	description: "Synthetic recipe for Completion API validation.",
	reason: "Provides deterministic historical cooking context.",
	estimatedDuration: { minMinutes: 10, maxMinutes: 15 },
	servings: 2,
	feasibility: "ready",
	ingredients: [{ name: "shallot", status: "available" }],
	equipment: [{ name: "wok", status: "available" }],
	preferenceMatches: [],
	requiredConfirmations: [],
	optionalIngredients: [],
	warnings: [],
};

const recommendationSnapshot: CookingRecommendationOutput = {
	type: "recommendations",
	recommendations: [selectedRecipe],
};

const cookingPlan: PreCookingOutput = {
	preparationSummary: { overview: "Prepare the Completion test dish." },
	ingredients: [{ name: "shallot" }],
	equipment: [{ name: "wok", required: true }],
	preparationSteps: [
		{ id: "prepare-aromatics", instruction: "Slice the shallot." },
	],
	cookingStages: [
		{
			id: "cook-aromatics",
			title: "Cook aromatics",
			steps: [{ id: "saute-aromatics", instruction: "Saute the shallot." }],
		},
		{
			id: "finish-dish",
			title: "Finish",
			steps: [{ id: "serve-dish", instruction: "Serve the finished dish." }],
		},
	],
};

const completionReadySession: CreateCookingSessionRequest["session"] = {
	status: "active",
	currentStageId: "finish-dish",
	currentStepId: "serve-dish",
	completedStepIds: ["prepare-aromatics", "saute-aromatics", "serve-dish"],
	changes: [
		{
			kind: "ingredient",
			description: "Added a little extra salt while cooking.",
			relatedStepId: "serve-dish",
		},
	],
};

const completionOutput = {
	reply: "Masakan selesai dan siap disajikan.",
	summary: {
		title: "Completion Test Dish selesai",
		description: "Sesi memasak diselesaikan mengikuti rencana yang tersimpan.",
	},
	notes: ["Sedikit garam tambahan digunakan saat memasak."],
};

const ErrorResponseSchema = z.object({
	error: z.object({ code: z.string(), message: z.string() }),
});

const { client, db } = createDatabase(databaseUrl);
const {
	authFoundation,
	createUser: createAuthenticatedUser,
	headers,
} = createSessionAuth(db);
let runner: (input: CompletionInput) => Promise<unknown>;
let capturedInput: CompletionInput | undefined;
const app = createApp({
	authFoundation,
	db,
	completionRunner: (input) => runner(input),
});
let ownerUserId = "";
let otherUserId = "";

async function createSession(
	session: CreateCookingSessionRequest["session"] = completionReadySession,
) {
	const response = await app.request("/api/cooking-sessions", {
		method: "POST",
		headers: headers(ownerUserId),
		body: JSON.stringify({
			recommendationSnapshot,
			selectedRecipeSnapshot: selectedRecipe,
			cookingPlan,
			session,
		}),
	});
	if (response.status !== 201) {
		throw new Error("Completion API test session could not be created");
	}
	return CookingSessionResponseSchema.parse(await response.json());
}

async function updateProgress(
	sessionId: string,
	session: CreateCookingSessionRequest["session"],
) {
	return app.request(`/api/cooking-sessions/${sessionId}/progress`, {
		method: "PATCH",
		headers: headers(ownerUserId),
		body: JSON.stringify({ session }),
	});
}

async function completeSession(sessionId: string) {
	const response = await updateProgress(sessionId, {
		...completionReadySession,
		status: "completed",
	});
	if (response.status !== 200) {
		throw new Error("Completion API test session could not be completed");
	}
	return CookingSessionResponseSchema.parse(await response.json());
}

async function generate(
	sessionId: string,
	body: unknown,
	userId = ownerUserId,
) {
	return app.request(`/api/cooking-sessions/${sessionId}/completion`, {
		method: "POST",
		headers: headers(userId),
		body: JSON.stringify(body),
	});
}

async function restore(sessionId: string) {
	const response = await app.request(`/api/cooking-sessions/${sessionId}`, {
		headers: headers(ownerUserId),
	});
	return CookingSessionResponseSchema.parse(await response.json());
}

beforeAll(async () => {
	ownerUserId = await createAuthenticatedUser();
	otherUserId = await createAuthenticatedUser();
});

afterAll(async () => {
	if (ownerUserId) await db.delete(users).where(eq(users.id, ownerUserId));
	if (otherUserId) await db.delete(users).where(eq(users.id, otherUserId));
	await client.end();
});

describe("Completion AI API integration", () => {
	test("generates from an owned completed session and persists canonical output", async () => {
		const created = await createSession();
		const renameResponse = await app.request(
			`/api/cooking-sessions/${created.id}`,
			{
				method: "PATCH",
				headers: headers(ownerUserId),
				body: JSON.stringify({ customName: "Friday shallots" }),
			},
		);
		expect(renameResponse.status).toBe(200);
		const completed = await completeSession(created.id);
		runner = async (input) => {
			capturedInput = input;
			return completionOutput;
		};

		const response = await generate(created.id, {
			message: "  Masakannya sudah selesai.  ",
		});
		const result = CookingSessionResponseSchema.parse(await response.json());
		const restored = await restore(created.id);

		expect(response.status).toBe(200);
		expect(completed.phase).toBe("completion");
		expect(completed.session.status).toBe("completed");
		expect(completed.completionSnapshot).toBeNull();
		expect(completed.nutritionSnapshot).toBeNull();
		expect(capturedInput).toEqual({
			cookingPlan,
			session: { ...completionReadySession, status: "completed" },
			message: "Masakannya sudah selesai.",
		});
		expect(result.customName).toBe("Friday shallots");
		expect(result.completionSnapshot).toEqual(completionOutput);
		expect(result.nutritionSnapshot).toBeNull();
		expect(restored.completionSnapshot).toEqual(completionOutput);
		expect(restored.nutritionSnapshot).toBeNull();
	});

	test("returns persisted output on retries without invoking the agent again", async () => {
		const created = await createSession();
		await completeSession(created.id);
		let calls = 0;
		runner = async () => {
			calls += 1;
			return completionOutput;
		};

		const first = await generate(created.id, {});
		const second = await generate(created.id, { message: "Different retry" });
		const firstResult = CookingSessionResponseSchema.parse(await first.json());
		const secondResult = CookingSessionResponseSchema.parse(
			await second.json(),
		);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(calls).toBe(1);
		expect(secondResult.completionSnapshot).toEqual(
			firstResult.completionSnapshot,
		);
	});

	test("serializes concurrent generation so only one output is produced", async () => {
		const created = await createSession();
		await completeSession(created.id);
		let calls = 0;
		let markStarted: (() => void) | undefined;
		let releaseRunner: (() => void) | undefined;
		const started = new Promise<void>((resolve) => {
			markStarted = resolve;
		});
		const release = new Promise<void>((resolve) => {
			releaseRunner = resolve;
		});
		runner = async () => {
			calls += 1;
			markStarted?.();
			await release;
			return completionOutput;
		};

		const firstRequest = generate(created.id, {});
		await started;
		const secondRequest = generate(created.id, {});
		releaseRunner?.();
		const [first, second] = await Promise.all([firstRequest, secondRequest]);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(calls).toBe(1);
	});

	test("keeps completion retryable after generation failure", async () => {
		const created = await createSession();
		await completeSession(created.id);
		let calls = 0;
		runner = async () => {
			calls += 1;
			if (calls === 1) throw new Error("private provider failure");
			return completionOutput;
		};

		const failed = await generate(created.id, {});
		const failedError = ErrorResponseSchema.parse(await failed.json());
		const afterFailure = await restore(created.id);
		const retried = await generate(created.id, {});
		const recovered = CookingSessionResponseSchema.parse(await retried.json());

		expect(failed.status).toBe(502);
		expect(failedError.error.code).toBe("COMPLETION_GENERATION_FAILED");
		expect(failedError.error.message).not.toContain("private provider failure");
		expect(afterFailure.completionSnapshot).toBeNull();
		expect(retried.status).toBe(200);
		expect(recovered.completionSnapshot).toEqual(completionOutput);
		expect(calls).toBe(2);
	});

	test("rejects non-completed sessions without invoking the agent", async () => {
		const active = await createSession();
		const paused = await createSession();
		const abandoned = await createSession();
		await updateProgress(paused.id, {
			...completionReadySession,
			status: "paused",
			pauseReason: "user-request",
		});
		await updateProgress(abandoned.id, {
			...completionReadySession,
			status: "abandoned",
		});
		let calls = 0;
		runner = async () => {
			calls += 1;
			return completionOutput;
		};

		for (const sessionId of [active.id, paused.id, abandoned.id]) {
			const response = await generate(sessionId, {});
			const error = ErrorResponseSchema.parse(await response.json());
			expect(response.status).toBe(409);
			expect(error.error.code).toBe("INVALID_SESSION_STATE");
		}
		expect(calls).toBe(0);
	});

	test("refuses to persist completion before the final step is complete", async () => {
		const created = await createSession({
			...completionReadySession,
			completedStepIds: ["prepare-aromatics", "saute-aromatics"],
		});
		const response = await updateProgress(created.id, {
			...completionReadySession,
			status: "completed",
			completedStepIds: ["prepare-aromatics", "saute-aromatics"],
		});
		const error = ErrorResponseSchema.parse(await response.json());
		const restored = await restore(created.id);

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("SESSION_NOT_READY_FOR_COMPLETION");
		expect(restored.session.status).toBe("active");
		expect(restored.phase).toBe("active_cooking");
	});

	test("maps corrupt persisted completed state to a controlled error", async () => {
		const created = await createSession();
		await completeSession(created.id);
		await db
			.update(cookingSessions)
			.set({ preCookingPlanSnapshot: sql`'{"invalid":true}'::jsonb` })
			.where(eq(cookingSessions.id, created.id));
		let called = false;
		runner = async () => {
			called = true;
			return completionOutput;
		};

		const response = await generate(created.id, {});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(500);
		expect(error.error.code).toBe("INVALID_PERSISTED_SNAPSHOT");
		expect(called).toBeFalse();
	});

	test("validates request, authentication, ownership, and missing sessions", async () => {
		const created = await createSession();
		await completeSession(created.id);
		runner = async () => completionOutput;
		const blank = await generate(created.id, { message: "   " });
		const clientState = await generate(created.id, { cookingPlan });
		const unauthenticated = await app.request(
			`/api/cooking-sessions/${created.id}/completion`,
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({}),
			},
		);
		const forbidden = await generate(created.id, {}, otherUserId);
		const missing = await generate(crypto.randomUUID(), {});

		expect(blank.status).toBe(400);
		expect(clientState.status).toBe(400);
		expect(unauthenticated.status).toBe(401);
		expect(forbidden.status).toBe(403);
		expect(missing.status).toBe(404);
	});

	test("maps invalid output and missing provider configuration", async () => {
		const invalidSession = await createSession();
		await completeSession(invalidSession.id);
		runner = async () => ({ reply: "", summary: {}, notes: [] });
		const invalid = await generate(invalidSession.id, {});
		const invalidError = ErrorResponseSchema.parse(await invalid.json());

		const unconfiguredSession = await createSession();
		await completeSession(unconfiguredSession.id);
		const unconfiguredApp = createApp({ authFoundation, db });
		const unconfigured = await unconfiguredApp.request(
			`/api/cooking-sessions/${unconfiguredSession.id}/completion`,
			{
				method: "POST",
				headers: headers(ownerUserId),
				body: JSON.stringify({}),
			},
		);
		const unconfiguredError = ErrorResponseSchema.parse(
			await unconfigured.json(),
		);

		expect(invalid.status).toBe(502);
		expect(invalidError.error.code).toBe("INVALID_AGENT_OUTPUT");
		expect(unconfigured.status).toBe(503);
		expect(unconfiguredError.error.code).toBe("AGENT_NOT_CONFIGURED");
	});

	test("publishes the authenticated Completion endpoint in OpenAPI", async () => {
		const response = await app.request("/api/openapi.json");
		const specification = z
			.object({ paths: z.record(z.string(), z.unknown()) })
			.parse(await response.json());

		expect(response.status).toBe(200);
		expect(Object.keys(specification.paths)).toContain(
			"/api/cooking-sessions/{id}/completion",
		);
	});
});
