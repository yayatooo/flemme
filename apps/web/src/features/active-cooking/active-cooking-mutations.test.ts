import { afterEach, expect, test } from "bun:test";
import type { ActiveCookingAction } from "@flemme/agent/active-cooking-output";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import { QueryClient } from "@tanstack/react-query";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";
import {
	cookingSessionFixture,
	cookingSessionId,
} from "@/features/cooking-session/cooking-session-test-fixture";
import {
	buildCookingSessionProgress,
	executeCookingAssistantRequest,
	executeCookingProgressCommand,
	prepareAssistantActions,
} from "./active-cooking-mutations";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function sessionAt(
	stageId: string,
	stepId: string,
	completedStepIds: string[] = [],
): CookingSessionResponse {
	return {
		...cookingSessionFixture,
		session: {
			...cookingSessionFixture.session,
			currentStageId: stageId,
			currentStepId: stepId,
			completedStepIds,
		},
	};
}

function jsonResponse(value: unknown, status = 200) {
	return new Response(JSON.stringify(value), {
		status,
		headers: { "content-type": "application/json" },
	});
}

test("advance persists the current step and crosses the stage boundary", () => {
	const advanced = buildCookingSessionProgress(cookingSessionFixture, {
		type: "advance",
	});

	expect(advanced.currentStageId).toBe("cook-chicken");
	expect(advanced.currentStepId).toBe("brown-chicken");
	expect(advanced.completedStepIds).toEqual(["toast-garlic"]);
	expect(cookingSessionFixture.cookingPlan.cookingStages[0].steps[0].id).toBe(
		"toast-garlic",
	);
});

test("previous moves by stable IDs without undoing completed steps", () => {
	const previous = buildCookingSessionProgress(
		sessionAt("cook-chicken", "brown-chicken", ["toast-garlic"]),
		{ type: "previous" },
	);

	expect(previous.currentStageId).toBe("build-sauce");
	expect(previous.currentStepId).toBe("toast-garlic");
	expect(previous.completedStepIds).toEqual(["toast-garlic"]);
	expect(() =>
		buildCookingSessionProgress(cookingSessionFixture, { type: "previous" }),
	).toThrow("first cooking step");
});

test("the final step is recorded without requesting Completion output", () => {
	const final = sessionAt("cook-chicken", "coat-chicken", [
		"toast-garlic",
		"brown-chicken",
	]);
	const completedSteps = buildCookingSessionProgress(final, {
		type: "advance",
	});

	expect(completedSteps.status).toBe("active");
	expect(completedSteps.currentStepId).toBe("coat-chicken");
	expect(completedSteps.completedStepIds).toContain("coat-chicken");
	expect(final.completionSnapshot).toBeNull();
	expect(final.nutritionSnapshot).toBeNull();
});

test("pause preserves a reason and resume keeps the same position", () => {
	const paused = buildCookingSessionProgress(cookingSessionFixture, {
		type: "pause",
		reason: "missing-ingredient",
	});
	expect(paused).toMatchObject({
		status: "paused",
		pauseReason: "missing-ingredient",
		currentStageId: "build-sauce",
		currentStepId: "toast-garlic",
	});

	const resumed = buildCookingSessionProgress(
		{ ...cookingSessionFixture, session: paused },
		{ type: "resume" },
	);
	expect(resumed).toEqual({
		status: "active",
		currentStageId: "build-sauce",
		currentStepId: "toast-garlic",
		completedStepIds: [],
		changes: [],
	});
});

test("records every shared change kind with a stable related step ID", () => {
	const kinds = [
		"ingredient",
		"equipment",
		"servings",
		"step",
		"other",
	] as const;
	let current: CookingSessionResponse = cookingSessionFixture;
	for (const kind of kinds) {
		current = {
			...current,
			session: buildCookingSessionProgress(current, {
				type: "record-change",
				change: {
					kind,
					description: `${kind} changed`,
					relatedStepId: "toast-garlic",
				},
			}),
		};
	}

	expect(current.session.changes.map((change) => change.kind)).toEqual(kinds);
	expect(
		current.session.changes.every(
			(change) => change.relatedStepId === "toast-garlic",
		),
	).toBe(true);
	expect(current.cookingPlan).toBe(cookingSessionFixture.cookingPlan);
});

test("assistant reply-only and clarify outputs do not mutate progress", () => {
	for (const actions of [
		[],
		[{ type: "clarify" } satisfies ActiveCookingAction],
	]) {
		const prepared = prepareAssistantActions(cookingSessionFixture, actions);
		expect(prepared).toEqual({
			session: null,
			requiresAbandonConfirmation: false,
		});
	}
});

test("assistant advance and record-change actions create one accepted snapshot", () => {
	const prepared = prepareAssistantActions(cookingSessionFixture, [
		{
			type: "record-change",
			change: {
				kind: "ingredient",
				description: "Used less chili",
				relatedStepId: "toast-garlic",
			},
		},
		{ type: "advance" },
	]);

	expect(prepared.session).toMatchObject({
		status: "active",
		currentStageId: "cook-chicken",
		currentStepId: "brown-chicken",
		completedStepIds: ["toast-garlic"],
		changes: [
			{
				kind: "ingredient",
				description: "Used less chili",
				relatedStepId: "toast-garlic",
			},
		],
	});
});

test("assistant abandonment requires confirmation before mutation", () => {
	const actions: ActiveCookingAction[] = [{ type: "abandon-cooking" }];
	const proposed = prepareAssistantActions(cookingSessionFixture, actions);
	const confirmed = prepareAssistantActions(
		cookingSessionFixture,
		actions,
		true,
	);

	expect(proposed).toEqual({
		session: null,
		requiresAbandonConfirmation: true,
	});
	expect(confirmed.session?.status).toBe("abandoned");
});

test("double Next sends exactly one progress mutation and caches its response", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(
		cookingSessionQueryKey(cookingSessionId),
		cookingSessionFixture,
	);
	const requests: Array<{ path: string; body: unknown }> = [];
	let resolveRequest: ((response: Response) => void) | undefined;
	const pendingResponse = new Promise<Response>((resolve) => {
		resolveRequest = resolve;
	});
	globalThis.fetch = (async (input, init) => {
		const body = JSON.parse(String(init?.body)) as {
			session: CookingSessionResponse["session"];
		};
		requests.push({ path: new URL(String(input)).pathname, body });
		return pendingResponse;
	}) as typeof fetch;

	const first = executeCookingProgressCommand(queryClient, cookingSessionId, {
		type: "advance",
	});
	const duplicate = await executeCookingProgressCommand(
		queryClient,
		cookingSessionId,
		{ type: "advance" },
	);
	const persisted = {
		...cookingSessionFixture,
		session: buildCookingSessionProgress(cookingSessionFixture, {
			type: "advance",
		}),
	};
	resolveRequest?.(jsonResponse(persisted));
	await first;

	expect(duplicate).toBeNull();
	expect(requests).toHaveLength(1);
	expect(requests[0]?.path).toBe(
		`/cooking-sessions/${cookingSessionId}/progress`,
	);
	expect(requests[0]?.body).toEqual({ session: persisted.session });
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toEqual(persisted);
	expect(requests.some(({ path }) => path.includes("completion"))).toBe(false);
	expect(requests.some(({ path }) => path.includes("inventory"))).toBe(false);
});

test("assistant guidance without actions performs no progress request", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(
		cookingSessionQueryKey(cookingSessionId),
		cookingSessionFixture,
	);
	const paths: string[] = [];
	globalThis.fetch = (async (input) => {
		paths.push(new URL(String(input)).pathname);
		return jsonResponse({
			reply: "Lower the heat and keep stirring.",
			actions: [],
		});
	}) as typeof fetch;

	const result = await executeCookingAssistantRequest(
		queryClient,
		cookingSessionId,
		"The garlic is browning too fast",
	);

	expect(result?.output.reply).toContain("Lower the heat");
	expect(paths).toEqual([
		`/cooking-sessions/${cookingSessionId}/active-cooking`,
	]);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toBe(cookingSessionFixture);
});

test("assistant structured advance performs one explicit progress mutation", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(
		cookingSessionQueryKey(cookingSessionId),
		cookingSessionFixture,
	);
	const paths: string[] = [];
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		paths.push(path);
		if (path.endsWith("/active-cooking")) {
			return jsonResponse({
				reply: "Move to the next step.",
				actions: [{ type: "advance" }],
			});
		}
		const body = JSON.parse(String(init?.body)) as {
			session: CookingSessionResponse["session"];
		};
		return jsonResponse({ ...cookingSessionFixture, session: body.session });
	}) as typeof fetch;

	const result = await executeCookingAssistantRequest(
		queryClient,
		cookingSessionId,
		"This step is done",
	);

	expect(result?.actionError).toBeUndefined();
	expect(paths).toEqual([
		`/cooking-sessions/${cookingSessionId}/active-cooking`,
		`/cooking-sessions/${cookingSessionId}/progress`,
	]);
	const cached = queryClient.getQueryData<CookingSessionResponse>(
		cookingSessionQueryKey(cookingSessionId),
	);
	expect(cached?.session.currentStepId).toBe("brown-chicken");
});

test("duplicate assistant submission is blocked and failure preserves progress", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(
		cookingSessionQueryKey(cookingSessionId),
		cookingSessionFixture,
	);
	let requests = 0;
	let rejectRequest: ((error: Error) => void) | undefined;
	const pendingResponse = new Promise<Response>((_resolve, reject) => {
		rejectRequest = reject;
	});
	globalThis.fetch = (() => {
		requests += 1;
		return pendingResponse;
	}) as typeof fetch;

	const first = executeCookingAssistantRequest(
		queryClient,
		cookingSessionId,
		"Can I continue?",
	);
	const duplicate = await executeCookingAssistantRequest(
		queryClient,
		cookingSessionId,
		"Can I continue?",
	);
	rejectRequest?.(new Error("network unavailable"));
	await expect(first).rejects.toThrow();

	expect(duplicate).toBeNull();
	expect(requests).toBe(1);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toBe(cookingSessionFixture);
});
