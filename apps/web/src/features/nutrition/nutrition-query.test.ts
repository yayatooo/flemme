import { afterEach, expect, test } from "bun:test";
import type { CookingSessionResponse } from "@flemme/contracts/cooking-session";
import type { RecipeNutritionResult } from "@flemme/nutrition/recipe-nutrition";
import { QueryClient } from "@tanstack/react-query";
import { cookingSessionQueryKey } from "@/features/cooking-session/cooking-session-query";
import {
	cookingSessionFixture,
	cookingSessionId,
} from "@/features/cooking-session/cooking-session-test-fixture";
import { cookingHistoryQueryKey } from "@/features/history/cooking-history-query";
import { requestNutrition, restoreOrRequestNutrition } from "./nutrition-query";

const nutritionSnapshot = {
	status: "complete",
	estimated: true,
	servings: 2,
	includedIngredients: [
		{ ingredientKey: "tomato", name: "Tomato", grams: 200 },
	],
	total: { caloriesKcal: 36, proteinG: 1.76, carbsG: 7.78, fatG: 0.4 },
	perServing: {
		caloriesKcal: 18,
		proteinG: 0.88,
		carbsG: 3.89,
		fatG: 0.2,
	},
} satisfies RecipeNutritionResult;

const completedSession: CookingSessionResponse = {
	...cookingSessionFixture,
	customName: "Tomato night",
	phase: "completion",
	session: {
		...cookingSessionFixture.session,
		status: "completed",
	},
	completionSnapshot: {
		reply: "Dinner is ready.",
		summary: { title: "Done", description: "The meal is complete." },
		notes: [],
	},
	nutritionSnapshot,
	completedAt: "2026-09-15T10:30:00.000Z",
};

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("generation sends one canonical Nutrition request and seeds the session cache", async () => {
	const requests: Array<{ path: string; method: string }> = [];
	globalThis.fetch = (async (input, init) => {
		requests.push({
			path: new URL(String(input)).pathname,
			method: init?.method ?? "GET",
		});
		return Response.json(completedSession);
	}) as typeof fetch;
	const queryClient = new QueryClient();
	queryClient.setQueryData(cookingHistoryQueryKey(), {
		pages: [],
		pageParams: [],
	});

	const output = await requestNutrition(queryClient, cookingSessionId);

	expect(output).toEqual(nutritionSnapshot);
	expect(requests).toEqual([
		{
			path: `/cooking-sessions/${cookingSessionId}/nutrition`,
			method: "POST",
		},
	]);
	expect(
		queryClient.getQueryData(cookingSessionQueryKey(cookingSessionId)),
	).toEqual(completedSession);
	expect(
		queryClient.getQueryState(cookingHistoryQueryKey())?.isInvalidated,
	).toBe(true);
	expect(requests.some(({ path }) => path.includes("completion"))).toBeFalse();
	expect(requests.some(({ path }) => path.includes("inventory"))).toBeFalse();
	expect(requests.some(({ path }) => path.includes("favorite"))).toBeFalse();
});

test("refresh restores persisted Nutrition without another generation request", async () => {
	let requests = 0;
	globalThis.fetch = (async () => {
		requests += 1;
		return Response.json(completedSession);
	}) as typeof fetch;

	const output = await restoreOrRequestNutrition(
		new QueryClient(),
		cookingSessionId,
		completedSession,
	);

	expect(output).toEqual(nutritionSnapshot);
	expect(requests).toBe(0);
});
