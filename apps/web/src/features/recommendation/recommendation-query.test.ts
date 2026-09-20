import { afterEach, expect, test } from "bun:test";
import type { CookingRecommendationOutput } from "@flemme/agent/cooking-recommendation-output";
import { QueryClient } from "@tanstack/react-query";
import {
	appendClarificationResponse,
	beginRecommendation,
	executeRecommendation,
	preserveSelectedRecommendation,
	type RecommendationFlowState,
	type RecommendationSelection,
	recommendationFlowQueryKey,
	recommendationSelectionQueryKey,
	requestCookingRecommendation,
} from "./recommendation-query";
import {
	recommendationFixture,
	recommendationFixtures,
} from "./recommendation-test-fixture";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function installResponse(output: CookingRecommendationOutput) {
	let body: unknown;
	let url: string | undefined;
	let method: string | undefined;
	globalThis.fetch = (async (input, init) => {
		url = String(input);
		method = init?.method;
		body = JSON.parse(String(init?.body));
		return Response.json(output);
	}) as typeof fetch;
	return () => ({ body, method, url });
}

const oneRecommendation: CookingRecommendationOutput = {
	type: "recommendations",
	recommendations: [recommendationFixture],
};

function flowState(queryClient: QueryClient) {
	return queryClient.getQueryData<RecommendationFlowState>(
		recommendationFlowQueryKey,
	);
}

test("Home submission sends only the current session request", async () => {
	const readRequest = installResponse(oneRecommendation);
	const result = await requestCookingRecommendation(
		new QueryClient(),
		"  Something spicy with chicken  ",
	);
	expect(readRequest()).toEqual({
		url: "http://localhost:3000/api/cooking/recommendations",
		method: "POST",
		body: {
			session: { request: "Something spicy with chicken" },
		},
	});
	expect(result).toEqual(oneRecommendation);
});

test("beginning a request exposes loading and blocks a duplicate", () => {
	const queryClient = new QueryClient();
	expect(beginRecommendation(queryClient, "Something quick")).toBe(
		"Something quick",
	);
	expect(flowState(queryClient)).toEqual({
		status: "loading",
		request: "Something quick",
	});
	expect(beginRecommendation(queryClient, "Another request")).toBeNull();
});

test("a successful request preserves one recommendation", async () => {
	installResponse(oneRecommendation);
	const queryClient = new QueryClient();
	beginRecommendation(queryClient, "Family dinner");
	await executeRecommendation(queryClient, "Family dinner");
	expect(flowState(queryClient)).toEqual({
		status: "success",
		request: "Family dinner",
		result: oneRecommendation,
	});
});

test("a successful request preserves three recommendations", async () => {
	const output: CookingRecommendationOutput = {
		type: "recommendations",
		recommendations: [...recommendationFixtures],
	};
	installResponse(output);
	const queryClient = new QueryClient();
	beginRecommendation(queryClient, "Give me options");
	await executeRecommendation(queryClient, "Give me options");
	expect(flowState(queryClient)).toMatchObject({ result: output });
});

test("clarification remains a distinct successful result", async () => {
	const output: CookingRecommendationOutput = {
		type: "clarification",
		question: "How much time do you have?",
		reason: "Cooking time changes the available recipes.",
	};
	installResponse(output);
	const queryClient = new QueryClient();
	beginRecommendation(queryClient, "Dinner");
	await executeRecommendation(queryClient, "Dinner");
	expect(flowState(queryClient)).toMatchObject({ result: output });
	expect(appendClarificationResponse("Dinner", "20 minutes")).toBe(
		"Dinner\n\nAdditional detail: 20 minutes",
	);
});

test("no viable recommendation remains a domain result", async () => {
	const output: CookingRecommendationOutput = {
		type: "no_viable_recommendation",
		reason: "No recipe fits the current request.",
		constraints: ["No required cooking equipment is available."],
	};
	installResponse(output);
	const queryClient = new QueryClient();
	beginRecommendation(queryClient, "Bake bread");
	await executeRecommendation(queryClient, "Bake bread");
	expect(flowState(queryClient)).toEqual({
		status: "success",
		request: "Bake bread",
		result: output,
	});
});

test("API failure keeps the request with a controlled retry message", async () => {
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "INTERNAL", message: "raw backend detail" } },
			{ status: 500 },
		)) as typeof fetch;
	const queryClient = new QueryClient();
	beginRecommendation(queryClient, "Keep this request");
	await expect(
		executeRecommendation(queryClient, "Keep this request"),
	).rejects.toBeDefined();
	expect(flowState(queryClient)).toEqual({
		status: "error",
		request: "Keep this request",
		message: "Flemme couldn't prepare recommendations. Try again in a moment.",
	});
});

test("selection preserves the exact recipe without changing the flow", () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(recommendationFlowQueryKey, {
		status: "success",
		request: "Dinner",
		result: oneRecommendation,
	});
	const selection = preserveSelectedRecommendation(
		queryClient,
		"Dinner",
		recommendationFixture,
	);
	expect(selection.selectedRecipe).toBe(recommendationFixture);
	expect(
		queryClient.getQueryData<RecommendationSelection>(
			recommendationSelectionQueryKey,
		)?.selectedRecipe,
	).toBe(recommendationFixture);
	expect(flowState(queryClient)?.request).toBe("Dinner");
});

test("back navigation can restore the latest Home request", () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(recommendationFlowQueryKey, {
		status: "error",
		request: "Still here",
		message: "Try again",
	} satisfies RecommendationFlowState);
	expect(flowState(queryClient)?.request).toBe("Still here");
});
