import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type {
	CompletionInput,
	CookingRecommendation,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import { cookingSessions, createDatabase, users } from "@flemme/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createApp } from "../../app";
import { createSessionAuth } from "../../test-utils/session-auth";
import {
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
} from "../cooking-session/cooking-session-schema";
import { CompletionResponseSchema } from "./completion-schema";

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
	const response = await app.request("/cooking-sessions", {
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

async function generate(
	sessionId: string,
	body: unknown,
	userId = ownerUserId,
) {
	return app.request(`/cooking-sessions/${sessionId}/completion`, {
		method: "POST",
		headers: headers(userId),
		body: JSON.stringify(body),
	});
}

async function restore(sessionId: string) {
	const response = await app.request(`/cooking-sessions/${sessionId}`, {
		headers: headers(ownerUserId),
	});

	return CookingSessionResponseSchema.parse(await response.json());
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

describe("Completion AI API integration", () => {
	test("projects a completion-ready session without persisting completion", async () => {
		const created = await createSession();
		const before = await restore(created.id);
		runner = async (input) => {
			capturedInput = input;
			return completionOutput;
		};

		const response = await generate(created.id, {
			message: "  Masakannya sudah selesai.  ",
		});
		const output = CompletionResponseSchema.parse(await response.json());
		const after = await restore(created.id);

		expect(response.status).toBe(200);
		expect(output).toEqual(completionOutput);
		expect(capturedInput).toEqual({
			cookingPlan,
			session: {
				...completionReadySession,
				status: "completed",
			},
			message: "Masakannya sudah selesai.",
		});
		expect(after).toEqual(before);
		expect(after.phase).toBe("active_cooking");
		expect(after.session.status).toBe("active");
		expect(after.completionSnapshot).toBeNull();
		expect(after.completedAt).toBeNull();
	});

	test("accepts an omitted optional completion message", async () => {
		const created = await createSession();
		runner = async (input) => {
			capturedInput = input;
			return completionOutput;
		};

		const response = await generate(created.id, {});

		expect(response.status).toBe(200);
		expect(capturedInput?.message).toBeUndefined();
	});

	test("rejects an incomplete final step without invoking the agent", async () => {
		const created = await createSession({
			...completionReadySession,
			completedStepIds: ["prepare-aromatics", "saute-aromatics"],
		});
		const before = await restore(created.id);
		let called = false;
		runner = async () => {
			called = true;
			return completionOutput;
		};

		const response = await generate(created.id, {});
		const error = ErrorResponseSchema.parse(await response.json());
		const after = await restore(created.id);

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("SESSION_NOT_READY_FOR_COMPLETION");
		expect(called).toBe(false);
		expect(after).toEqual(before);
	});

	test("rejects a session that has not reached the final step", async () => {
		const created = await createSession({
			...completionReadySession,
			currentStageId: "cook-aromatics",
			currentStepId: "saute-aromatics",
			completedStepIds: ["prepare-aromatics"],
		});
		let called = false;
		runner = async () => {
			called = true;
			return completionOutput;
		};

		const response = await generate(created.id, {});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("SESSION_NOT_READY_FOR_COMPLETION");
		expect(called).toBe(false);
	});

	test("rejects a paused session without invoking the agent", async () => {
		const created = await createSession();
		const pauseResponse = await app.request(
			`/cooking-sessions/${created.id}/progress`,
			{
				method: "PATCH",
				headers: headers(ownerUserId),
				body: JSON.stringify({
					session: {
						...completionReadySession,
						status: "paused",
						pauseReason: "user-request",
					},
				}),
			},
		);
		expect(pauseResponse.status).toBe(200);

		let called = false;
		runner = async () => {
			called = true;
			return completionOutput;
		};
		const response = await generate(created.id, {});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("INVALID_SESSION_STATE");
		expect(called).toBe(false);
	});

	test("rejects an already completed session without regenerating", async () => {
		const created = await createSession();
		const completionResponse = await app.request(
			`/cooking-sessions/${created.id}/complete`,
			{
				method: "POST",
				headers: headers(ownerUserId),
				body: JSON.stringify({ completionSnapshot: completionOutput }),
			},
		);
		expect(completionResponse.status).toBe(200);

		let called = false;
		runner = async () => {
			called = true;
			return completionOutput;
		};
		const response = await generate(created.id, {});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("INVALID_SESSION_STATE");
		expect(called).toBe(false);
	});

	test("rejects an abandoned session without invoking the agent", async () => {
		const created = await createSession();
		await db
			.update(cookingSessions)
			.set({ status: "abandoned" })
			.where(eq(cookingSessions.id, created.id));

		let called = false;
		runner = async () => {
			called = true;
			return completionOutput;
		};
		const response = await generate(created.id, {});
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(409);
		expect(error.error.code).toBe("INVALID_SESSION_STATE");
		expect(called).toBe(false);
	});

	test("validates the strict optional-message request", async () => {
		const created = await createSession();
		runner = async () => completionOutput;

		const blankResponse = await generate(created.id, { message: "   " });
		const longResponse = await generate(created.id, {
			message: "a".repeat(2_001),
		});
		const clientStateResponse = await generate(created.id, {
			cookingPlan,
		});

		expect(blankResponse.status).toBe(400);
		expect(longResponse.status).toBe(400);
		expect(clientStateResponse.status).toBe(400);
	});

	test("enforces authentication, ownership, and missing-session behavior", async () => {
		const created = await createSession();
		runner = async () => completionOutput;
		const unauthenticatedResponse = await app.request(
			`/cooking-sessions/${created.id}/completion`,
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({}),
			},
		);
		const forbiddenResponse = await generate(created.id, {}, otherUserId);
		const missingResponse = await generate(crypto.randomUUID(), {});

		expect(unauthenticatedResponse.status).toBe(401);
		expect(forbiddenResponse.status).toBe(403);
		expect(missingResponse.status).toBe(404);
	});

	test("maps Agent failures and invalid output to controlled errors", async () => {
		const created = await createSession();
		runner = async () => {
			throw new Error("private provider failure");
		};
		const failedResponse = await generate(created.id, {});
		const failedError = ErrorResponseSchema.parse(await failedResponse.json());

		runner = async () => ({ reply: "", summary: {}, notes: [] });
		const invalidResponse = await generate(created.id, {});
		const invalidError = ErrorResponseSchema.parse(
			await invalidResponse.json(),
		);

		expect(failedResponse.status).toBe(502);
		expect(failedError.error.code).toBe("COMPLETION_GENERATION_FAILED");
		expect(failedError.error.message).not.toContain("private provider failure");
		expect(invalidResponse.status).toBe(502);
		expect(invalidError.error.code).toBe("INVALID_AGENT_OUTPUT");
	});

	test("reports missing provider configuration", async () => {
		const created = await createSession();
		const unconfiguredApp = createApp({
			authFoundation,
			db,
		});
		const response = await unconfiguredApp.request(
			`/cooking-sessions/${created.id}/completion`,
			{
				method: "POST",
				headers: headers(ownerUserId),
				body: JSON.stringify({}),
			},
		);
		const error = ErrorResponseSchema.parse(await response.json());

		expect(response.status).toBe(503);
		expect(error.error.code).toBe("AGENT_NOT_CONFIGURED");
	});

	test("publishes the authenticated Completion endpoint in OpenAPI", async () => {
		const response = await app.request("/openapi.json");
		const specification = z
			.object({ paths: z.record(z.string(), z.unknown()) })
			.parse(await response.json());

		expect(response.status).toBe(200);
		expect(Object.keys(specification.paths)).toContain(
			"/cooking-sessions/{id}/completion",
		);
	});
});
