import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	ActiveCookingInput,
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import { cookingSessions, createDatabase, users } from "@flemme/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../app";
import { createSessionAuth } from "../test-utils/session-auth";
import { ActiveCookingResponseSchema } from "./active-cooking-schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for API integration tests");
}

const selectedRecipe: CookingRecommendation = {
	name: "Active Cooking Test Dish",
	description: "Synthetic recipe for Active Cooking API validation.",
	reason: "Provides deterministic persisted cooking context.",
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
	preparationSummary: { overview: "Prepare the Active Cooking test dish." },
	ingredients: [{ name: "shallot" }],
	equipment: [{ name: "wok", required: true }],
	preparationSteps: [
		{ id: "prepare-aromatics", instruction: "Slice the shallot." },
	],
	cookingStages: [
		{
			id: "cook-aromatics",
			title: "Cook aromatics",
			steps: [
				{
					id: "saute-aromatics",
					instruction: "Tumis bawang sampai harum.",
					timing: {
						level: "short",
						cue: "Bawang harum dan berwarna keemasan muda.",
					},
				},
				{ id: "add-sauce", instruction: "Add the sauce and stir." },
			],
		},
		{
			id: "finish-dish",
			title: "Finish",
			steps: [{ id: "serve-dish", instruction: "Serve the finished dish." }],
		},
	],
};

const createRequest = {
	recommendationSnapshot,
	selectedRecipeSnapshot: selectedRecipe,
	cookingPlan,
	session: {
		status: "active" as const,
		currentStageId: "cook-aromatics",
		currentStepId: "saute-aromatics",
		completedStepIds: ["prepare-aromatics"],
		changes: [],
	},
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
let runner: (input: ActiveCookingInput) => Promise<unknown>;
let capturedInput: ActiveCookingInput | undefined;
const app = createApp({
	authFoundation,
	db,
	activeCookingRunner: (input) => runner(input),
});
let ownerUserId = "";
let otherUserId = "";

async function createSession() {
	const response = await app.request("/cooking-sessions", {
		method: "POST",
		headers: headers(ownerUserId),
		body: JSON.stringify(createRequest),
	});

	if (response.status !== 201) {
		throw new Error("Active Cooking test session could not be created");
	}

	return z.object({ id: z.string().uuid() }).parse(await response.json()).id;
}

async function ask(sessionId: string, body: unknown, userId = ownerUserId) {
	return app.request(`/cooking-sessions/${sessionId}/active-cooking`, {
		method: "POST",
		headers: headers(userId),
		body: JSON.stringify(body),
	});
}

async function restore(sessionId: string) {
	const response = await app.request(`/cooking-sessions/${sessionId}`, {
		headers: headers(ownerUserId),
	});

	return response.json();
}

beforeAll(async () => {
	ownerUserId = await createAuthenticatedUser();
	otherUserId = await createAuthenticatedUser();
});

afterAll(async () => {
	if (ownerUserId) {
		await db.delete(users).where(eq(users.id, ownerUserId));
	}

	if (otherUserId) {
		await db.delete(users).where(eq(users.id, otherUserId));
	}

	await client.end();
});

describe("Active Cooking API integration", () => {
	test("returns guidance from persisted context without mutating the session", async () => {
		const sessionId = await createSession();
		const before = await restore(sessionId);
		runner = async (input) => {
			capturedInput = input;
			return {
				reply: "Kecilkan api dan segera aduk agar bawang tidak semakin gosong.",
				actions: [],
			};
		};

		const response = await ask(sessionId, {
			message: "  Bawangnya mulai gosong.  ",
		});
		const output = ActiveCookingResponseSchema.parse(await response.json());
		const after = await restore(sessionId);

		expect(response.status).toBe(200);
		expect(output.actions).toEqual([]);
		expect(capturedInput).toEqual({
			cookingPlan,
			session: createRequest.session,
			message: "Bawangnya mulai gosong.",
		});
		expect(after).toEqual(before);
	});

	test("returns an advance proposal without applying it", async () => {
		const sessionId = await createSession();
		const before = await restore(sessionId);
		runner = async () => ({
			reply: "Langkah ini selesai; kamu bisa lanjut.",
			actions: [{ type: "advance" }],
		});

		const response = await ask(sessionId, {
			message: "Langkah ini sudah selesai, lanjut.",
		});
		const output = ActiveCookingResponseSchema.parse(await response.json());
		const after = await restore(sessionId);

		expect(response.status).toBe(200);
		expect(output.actions).toEqual([{ type: "advance" }]);
		expect(after).toEqual(before);
	});

	test("returns a pause proposal without changing persisted status", async () => {
		const sessionId = await createSession();
		runner = async () => ({
			reply: "Kita bisa berhenti sebentar di langkah ini.",
			actions: [{ type: "pause", reason: "user-request" }],
		});

		const response = await ask(sessionId, {
			message: "Saya mau berhenti sebentar.",
		});
		const output = ActiveCookingResponseSchema.parse(await response.json());
		const after = z
			.object({ session: z.object({ status: z.string() }) })
			.parse(await restore(sessionId));

		expect(response.status).toBe(200);
		expect(output.actions).toEqual([{ type: "pause", reason: "user-request" }]);
		expect(after.session.status).toBe("active");
	});

	test("allows resume guidance for a paused session without resuming it", async () => {
		const sessionId = await createSession();
		const pauseResponse = await app.request(
			`/cooking-sessions/${sessionId}/progress`,
			{
				method: "PATCH",
				headers: headers(ownerUserId),
				body: JSON.stringify({
					session: {
						...createRequest.session,
						status: "paused",
						pauseReason: "user-request",
					},
				}),
			},
		);
		expect(pauseResponse.status).toBe(200);

		runner = async (input) => {
			capturedInput = input;
			return {
				reply: "Kita lanjut dari langkah yang sama.",
				actions: [{ type: "resume" }],
			};
		};
		const response = await ask(sessionId, {
			message: "Saya mau lanjut memasak.",
		});
		const output = ActiveCookingResponseSchema.parse(await response.json());
		const after = z
			.object({ session: z.object({ status: z.string() }) })
			.parse(await restore(sessionId));

		expect(response.status).toBe(200);
		expect(capturedInput?.session.status).toBe("paused");
		expect(output.actions).toEqual([{ type: "resume" }]);
		expect(after.session.status).toBe("paused");
	});

	test("rejects a completed session without invoking the agent", async () => {
		const sessionId = await createSession();
		const finalProgressResponse = await app.request(
			`/cooking-sessions/${sessionId}/progress`,
			{
				method: "PATCH",
				headers: headers(ownerUserId),
				body: JSON.stringify({
					session: {
						status: "active",
						currentStageId: "finish-dish",
						currentStepId: "serve-dish",
						completedStepIds: [
							"prepare-aromatics",
							"saute-aromatics",
							"add-sauce",
							"serve-dish",
						],
						changes: [],
					},
				}),
			},
		);
		expect(finalProgressResponse.status).toBe(200);

		const completionResponse = await app.request(
			`/cooking-sessions/${sessionId}/complete`,
			{
				method: "POST",
				headers: headers(ownerUserId),
				body: JSON.stringify({
					completionSnapshot: {
						reply: "Cooking is complete.",
						summary: {
							title: "Completed test dish",
							description: "The test cooking session was completed.",
						},
						notes: [],
					},
				}),
			},
		);
		expect(completionResponse.status).toBe(200);

		let called = false;
		runner = async () => {
			called = true;
			return { reply: "unexpected", actions: [] };
		};
		const response = await ask(sessionId, { message: "What now?" });
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("ACTIVE_COOKING_NOT_ALLOWED");
		expect(called).toBe(false);
	});

	test("rejects an abandoned session without invoking the agent", async () => {
		const sessionId = await createSession();
		await db
			.update(cookingSessions)
			.set({ status: "abandoned" })
			.where(eq(cookingSessions.id, sessionId));

		let called = false;
		runner = async () => {
			called = true;
			return { reply: "unexpected", actions: [] };
		};
		const response = await ask(sessionId, { message: "Continue" });
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("ACTIVE_COOKING_NOT_ALLOWED");
		expect(called).toBe(false);
	});

	test("returns the existing clarification action", async () => {
		const sessionId = await createSession();
		runner = async () => ({
			reply: "Apa yang belum selesai?",
			actions: [{ type: "clarify" }],
		});

		const response = await ask(sessionId, { message: "Belum." });
		const output = ActiveCookingResponseSchema.parse(await response.json());

		expect(response.status).toBe(200);
		expect(output.actions).toEqual([{ type: "clarify" }]);
	});

	test("validates the small message-only request", async () => {
		const sessionId = await createSession();
		runner = async () => ({ reply: "Valid", actions: [] });
		const emptyResponse = await ask(sessionId, { message: "   " });
		const longResponse = await ask(sessionId, { message: "a".repeat(2_001) });
		const clientStateResponse = await ask(sessionId, {
			message: "Continue",
			cookingPlan,
		});

		expect(emptyResponse.status).toBe(400);
		expect(longResponse.status).toBe(400);
		expect(clientStateResponse.status).toBe(400);
	});

	test("enforces authentication, ownership, and missing-session behavior", async () => {
		const sessionId = await createSession();
		runner = async () => ({ reply: "Valid", actions: [] });
		const unauthenticatedResponse = await app.request(
			`/cooking-sessions/${sessionId}/active-cooking`,
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "Continue" }),
			},
		);
		const forbiddenResponse = await ask(
			sessionId,
			{ message: "Continue" },
			otherUserId,
		);
		const missingResponse = await ask(crypto.randomUUID(), {
			message: "Continue",
		});

		expect(unauthenticatedResponse.status).toBe(401);
		expect(forbiddenResponse.status).toBe(403);
		expect(missingResponse.status).toBe(404);
	});

	test("maps agent failures and invalid output to controlled errors", async () => {
		const sessionId = await createSession();
		runner = async () => {
			throw new Error("private provider failure");
		};
		const failedResponse = await ask(sessionId, { message: "Continue" });
		const failedError = ErrorResponseSchema.parse(await failedResponse.json());

		runner = async () => ({
			reply: "Ambiguous output",
			actions: [{ type: "clarify" }, { type: "advance" }],
		});
		const invalidResponse = await ask(sessionId, { message: "Continue" });
		const invalidError = ErrorResponseSchema.parse(
			await invalidResponse.json(),
		);

		expect(failedResponse.status).toBe(502);
		expect(failedError.error.code).toBe("ACTIVE_COOKING_GENERATION_FAILED");
		expect(failedError.error.message).not.toContain("private provider failure");
		expect(invalidResponse.status).toBe(502);
		expect(invalidError.error.code).toBe("INVALID_AGENT_OUTPUT");
	});

	test("reports missing provider configuration after restoring the session", async () => {
		const sessionId = await createSession();
		const unconfiguredApp = createApp({
			authFoundation,
			db,
		});
		const response = await unconfiguredApp.request(
			`/cooking-sessions/${sessionId}/active-cooking`,
			{
				method: "POST",
				headers: headers(ownerUserId),
				body: JSON.stringify({ message: "Continue" }),
			},
		);
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("AGENT_NOT_CONFIGURED");
	});

	test("publishes the authenticated Active Cooking endpoint in OpenAPI", async () => {
		const response = await app.request("/openapi.json");
		const specification = z
			.object({ paths: z.record(z.string(), z.unknown()) })
			.parse(await response.json());

		expect(response.status).toBe(200);
		expect(Object.keys(specification.paths)).toContain(
			"/cooking-sessions/{id}/active-cooking",
		);
	});
});
