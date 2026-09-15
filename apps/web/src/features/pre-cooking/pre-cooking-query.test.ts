import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
	beginRecommendation,
	preserveSelectedRecommendation,
	recommendationFlowQueryKey,
} from "../recommendation/recommendation-query";
import { recommendationFixture } from "../recommendation/recommendation-test-fixture";
import {
	beginPreCooking,
	executePreCooking,
	type PreCookingFlowState,
	type PreCookingHandoff,
	preCookingFlowQueryKey,
	preCookingHandoffQueryKey,
	preservePreCookingHandoff,
	requestPreCookingPlan,
	resolvePreCookingEntry,
} from "./pre-cooking-query";
import { preCookingFixture } from "./pre-cooking-test-fixture";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

const selection = {
	request: "  Quick chicken dinner  ",
	selectedRecipe: recommendationFixture,
};

function flowState(queryClient: QueryClient) {
	return queryClient.getQueryData<PreCookingFlowState>(preCookingFlowQueryKey);
}

test("selected recipe generates one validated pre-cooking plan", async () => {
	let requestCount = 0;
	let request: { url?: string; method?: string; body?: unknown } = {};
	globalThis.fetch = (async (input, init) => {
		requestCount += 1;
		request = {
			url: String(input),
			method: init?.method,
			body: JSON.parse(String(init?.body)),
		};
		return Response.json(preCookingFixture);
	}) as typeof fetch;

	const plan = await requestPreCookingPlan(new QueryClient(), selection);
	expect(request).toEqual({
		url: "http://localhost:3000/cooking/pre-cooking",
		method: "POST",
		body: {
			selectedRecipe: recommendationFixture,
			session: { request: "Quick chicken dinner" },
		},
	});
	expect(requestCount).toBe(1);
	expect(plan).toEqual(preCookingFixture);
});

test("shared schema rejects an invalid generated plan", async () => {
	globalThis.fetch = (async () =>
		Response.json({ ...preCookingFixture, cookingStages: [] })) as typeof fetch;
	await expect(
		requestPreCookingPlan(new QueryClient(), selection),
	).rejects.toBeDefined();
});

test("loading blocks duplicate generation for the current selection", () => {
	const queryClient = new QueryClient();
	expect(beginPreCooking(queryClient, selection)).toBe(selection);
	expect(flowState(queryClient)).toEqual({ status: "loading", selection });
	expect(beginPreCooking(queryClient, selection)).toBeNull();
});

test("API error preserves selection and retry replaces it with the plan", async () => {
	const queryClient = new QueryClient();
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "GENERATION_FAILED", message: "raw detail" } },
			{ status: 502 },
		)) as typeof fetch;
	beginPreCooking(queryClient, selection);
	await expect(executePreCooking(queryClient, selection)).rejects.toBeDefined();
	expect(flowState(queryClient)).toEqual({
		status: "error",
		selection,
		message:
			"Flemme couldn't prepare your cooking plan. Try again in a moment.",
	});

	globalThis.fetch = (async () =>
		Response.json(preCookingFixture)) as typeof fetch;
	expect(beginPreCooking(queryClient, selection)).toBe(selection);
	await executePreCooking(queryClient, selection);
	const flow = flowState(queryClient);
	expect(flow?.status).toBe("success");
	if (flow?.status === "success") {
		expect(flow.selection).toBe(selection);
		expect(flow.plan).toEqual(preCookingFixture);
		const handoff = queryClient.getQueryData<PreCookingHandoff>(
			preCookingHandoffQueryKey,
		);
		expect(handoff?.selectedRecipe).toBe(selection.selectedRecipe);
		expect(handoff?.plan).toBe(flow.plan);
	}
});

test("Start Cooking preserves exact selection and plan without a request", () => {
	const queryClient = new QueryClient();
	const plan = preCookingFixture;
	const flow = {
		status: "success",
		selection,
		plan,
	} as const satisfies PreCookingFlowState;
	const handoff = preservePreCookingHandoff(queryClient, flow);

	expect(handoff.selectedRecipe).toBe(recommendationFixture);
	expect(handoff.plan).toBe(plan);
	expect(
		queryClient.getQueryData<PreCookingHandoff>(preCookingHandoffQueryKey),
	).toBe(handoff);
});

test("entry guard requires both a selection and its current generation state", () => {
	const queryClient = new QueryClient();
	expect(resolvePreCookingEntry(queryClient)).toBe("/app");
	queryClient.setQueryData(recommendationFlowQueryKey, {
		status: "success",
		request: selection.request,
		result: {
			type: "recommendations",
			recommendations: [recommendationFixture],
		},
	});
	expect(resolvePreCookingEntry(queryClient)).toBe("/app/recommendation");
	const preserved = preserveSelectedRecommendation(
		queryClient,
		selection.request,
		recommendationFixture,
	);
	expect(resolvePreCookingEntry(queryClient)).toBe("/app/recommendation");
	beginPreCooking(queryClient, preserved);
	expect(resolvePreCookingEntry(queryClient)).toBeNull();
});

test("a new recommendation request clears the downstream plan and handoff", () => {
	const queryClient = new QueryClient();
	const flow = {
		status: "success",
		selection,
		plan: preCookingFixture,
	} as const satisfies PreCookingFlowState;
	queryClient.setQueryData(preCookingFlowQueryKey, flow);
	preservePreCookingHandoff(queryClient, flow);

	expect(beginRecommendation(queryClient, "A different dinner")).toBe(
		"A different dinner",
	);
	expect(flowState(queryClient)).toBeUndefined();
	expect(queryClient.getQueryData(preCookingHandoffQueryKey)).toBeUndefined();
});
