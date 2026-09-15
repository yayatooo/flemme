import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "@/api/api-client";
import {
	type PreCookingHandoff,
	preCookingHandoffQueryKey,
} from "@/features/pre-cooking/pre-cooking-query";
import { preCookingFixture } from "@/features/pre-cooking/pre-cooking-test-fixture";
import { recommendationFixture } from "@/features/recommendation/recommendation-test-fixture";
import {
	beginCookingSessionCreation,
	buildCreateCookingSessionRequest,
	type CookingSessionCreationInput,
	type CookingSessionCreationState,
	cookingSessionCreationQueryKey,
	cookingSessionQueryKey,
	cookingSessionQueryOptions,
	cookingSessionReadErrorMessage,
	executeCookingSessionCreation,
	requestCookingSessionCreation,
} from "./cooking-session-query";
import {
	cookingSessionFixture,
	cookingSessionId,
	recommendationSnapshot,
} from "./cooking-session-test-fixture";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

const handoff: PreCookingHandoff = {
	request: "Quick chicken dinner",
	selectedRecipe: recommendationFixture,
	plan: preCookingFixture,
};
const creationInput: CookingSessionCreationInput = {
	handoff,
	recommendationSnapshot,
};

function creationState(queryClient: QueryClient) {
	return queryClient.getQueryData<CookingSessionCreationState>(
		cookingSessionCreationQueryKey,
	);
}

test("creation payload preserves the exact approved snapshots and stable IDs", () => {
	const request = buildCreateCookingSessionRequest(creationInput);
	expect(request.recommendationSnapshot).toBe(recommendationSnapshot);
	expect(request.selectedRecipeSnapshot).toBe(recommendationFixture);
	expect(request.cookingPlan).toBe(preCookingFixture);
	expect(request.session).toEqual({
		status: "active",
		currentStageId: preCookingFixture.cookingStages[0].id,
		currentStepId: preCookingFixture.cookingStages[0].steps[0].id,
		completedStepIds: [],
		changes: [],
	});
});

test("Start Cooking sends only one real Cooking Session create request", async () => {
	const requests: Array<{ url: string; method?: string; body: unknown }> = [];
	globalThis.fetch = (async (input, init) => {
		requests.push({
			url: String(input),
			method: init?.method,
			body: JSON.parse(String(init?.body)),
		});
		return Response.json(cookingSessionFixture, { status: 201 });
	}) as typeof fetch;

	const session = await requestCookingSessionCreation(
		new QueryClient(),
		creationInput,
	);
	expect(session.id).toBe(cookingSessionId);
	expect(requests).toHaveLength(1);
	expect(requests[0]).toEqual({
		url: "http://localhost:3000/cooking-sessions",
		method: "POST",
		body: buildCreateCookingSessionRequest(creationInput),
	});
	expect(
		requests.some(({ url }) => url.includes("recommendations")),
	).toBeFalse();
	expect(requests.some(({ url }) => url.includes("pre-cooking"))).toBeFalse();
	expect(requests.some(({ url }) => url.includes("inventory"))).toBeFalse();
	expect(requests.some(({ url }) => url.includes("completion"))).toBeFalse();
});

test("synchronous creation state blocks a duplicate click", () => {
	const queryClient = new QueryClient();
	expect(beginCookingSessionCreation(queryClient, creationInput)).toBe(
		creationInput,
	);
	expect(
		beginCookingSessionCreation(queryClient, { ...creationInput }),
	).toBeNull();
	expect(creationState(queryClient)).toEqual({
		status: "pending",
		input: creationInput,
	});
});

test("successful creation seeds the stable session cache", async () => {
	globalThis.fetch = (async () =>
		Response.json(cookingSessionFixture, { status: 201 })) as typeof fetch;
	const queryClient = new QueryClient();
	beginCookingSessionCreation(queryClient, creationInput);
	const session = await executeCookingSessionCreation(
		queryClient,
		creationInput,
	);

	expect(session.id).toBe(cookingSessionId);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toBe(session);
	expect(creationState(queryClient)).toEqual({
		status: "success",
		input: creationInput,
		sessionId: cookingSessionId,
	});
	expect(beginCookingSessionCreation(queryClient, creationInput)).toBeNull();
});

test("creation failure preserves handoff and retry succeeds", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(preCookingHandoffQueryKey, handoff);
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "CREATE_FAILED", message: "raw detail" } },
			{ status: 500 },
		)) as typeof fetch;
	beginCookingSessionCreation(queryClient, creationInput);
	await expect(
		executeCookingSessionCreation(queryClient, creationInput),
	).rejects.toBeDefined();
	expect(
		queryClient.getQueryData<PreCookingHandoff>(preCookingHandoffQueryKey),
	).toBe(handoff);
	expect(creationState(queryClient)).toEqual({
		status: "error",
		input: creationInput,
		message: "Couldn't start your cooking session. Your plan is still here.",
	});

	globalThis.fetch = (async () =>
		Response.json(cookingSessionFixture, { status: 201 })) as typeof fetch;
	expect(beginCookingSessionCreation(queryClient, creationInput)).toBe(
		creationInput,
	);
	await executeCookingSessionCreation(queryClient, creationInput);
	expect(creationState(queryClient)?.status).toBe("success");
});

test("refresh-safe session query restores by ID without transient flow state", async () => {
	let requestedUrl = "";
	globalThis.fetch = (async (input) => {
		requestedUrl = String(input);
		return Response.json(cookingSessionFixture);
	}) as typeof fetch;
	const queryClient = new QueryClient();
	const restored = await queryClient.fetchQuery(
		cookingSessionQueryOptions(queryClient, cookingSessionId),
	);

	expect(requestedUrl).toBe(
		`http://localhost:3000/cooking-sessions/${cookingSessionId}`,
	);
	expect(restored).toEqual(cookingSessionFixture);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toEqual(cookingSessionFixture);
	expect(queryClient.getQueryData(preCookingHandoffQueryKey)).toBeUndefined();
});

test("invalid, missing, forbidden, and corrupt sessions use controlled messages", () => {
	expect(
		cookingSessionReadErrorMessage(
			new FlemmeApiError(400, "INVALID_REQUEST", "raw"),
		),
	).toBe("This cooking session link is invalid.");
	expect(
		cookingSessionReadErrorMessage(
			new FlemmeApiError(404, "COOKING_SESSION_NOT_FOUND", "raw"),
		),
	).toBe("This cooking session was not found.");
	expect(
		cookingSessionReadErrorMessage(
			new FlemmeApiError(403, "COOKING_SESSION_FORBIDDEN", "raw"),
		),
	).toBe("You don't have access to this cooking session.");
	expect(
		cookingSessionReadErrorMessage(
			new FlemmeApiError(500, "INVALID_PERSISTED_SNAPSHOT", "raw"),
		),
	).toBe("This cooking session could not be restored safely.");
});
