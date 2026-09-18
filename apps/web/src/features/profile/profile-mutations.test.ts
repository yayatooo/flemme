import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { authQueryKey } from "@/auth/auth-query";
import { householdQueryKey } from "@/onboarding/household-query";
import { profileQueryKey } from "@/onboarding/profile-query";
import {
	saveHousehold,
	savePreferences,
	updateDisplayName,
} from "./profile-mutations";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("display name save performs one mutation and updates shared identity", async () => {
	const queryClient = new QueryClient();
	const original = {
		id: "70d2589b-79d6-4a7d-a1c5-e4c4472bf228",
		email: "tiara@example.com",
		name: "Tiara",
		image: "https://example.com/tiara.png",
	};
	const updated = { ...original, name: "Tiara Putri" };
	queryClient.setQueryData(authQueryKey, original);
	let requests = 0;
	globalThis.fetch = (async (input, init) => {
		requests += 1;
		expect(new URL(String(input)).pathname).toBe("/auth/me");
		expect(init?.method).toBe("PATCH");
		expect(JSON.parse(String(init?.body))).toEqual({ name: "Tiara Putri" });
		return Response.json({ user: updated });
	}) as typeof fetch;

	expect(await updateDisplayName(queryClient, "Tiara Putri")).toEqual(updated);
	expect(requests).toBe(1);
	expect(queryClient.getQueryData(authQueryKey)).toEqual(updated);
});

test("preference save replaces the canonical context cache with one request", async () => {
	const queryClient = new QueryClient();
	const original = {
		foodPreferences: ["mild"],
		cookingPreferences: ["simple"],
	};
	const updated = {
		foodPreferences: ["spicy"],
		cookingPreferences: ["one-pan"],
	};
	queryClient.setQueryData(profileQueryKey, original);
	let requests = 0;
	globalThis.fetch = (async (input, init) => {
		requests += 1;
		expect(new URL(String(input)).pathname).toBe("/profile");
		expect(init?.method).toBe("PUT");
		expect(JSON.parse(String(init?.body))).toEqual(updated);
		return Response.json(updated);
	}) as typeof fetch;

	expect(await savePreferences(queryClient, updated)).toEqual(updated);
	expect(requests).toBe(1);
	expect(queryClient.getQueryData(profileQueryKey)).toEqual(updated);
});

test("failed preference save preserves the last persisted cache", async () => {
	const queryClient = new QueryClient();
	const persisted = {
		foodPreferences: ["mild"],
		cookingPreferences: ["quick"],
	};
	queryClient.setQueryData(profileQueryKey, persisted);
	globalThis.fetch = (async () =>
		Response.json(
			{ error: { code: "PROFILE_SAVE_FAILED", message: "Database detail" } },
			{ status: 500 },
		)) as typeof fetch;

	await expect(
		savePreferences(queryClient, {
			foodPreferences: ["spicy"],
			cookingPreferences: ["quick"],
		}),
	).rejects.toMatchObject({ code: "PROFILE_SAVE_FAILED" });
	expect(queryClient.getQueryData(profileQueryKey)).toEqual(persisted);
});

test("household save updates the existing household cache", async () => {
	const queryClient = new QueryClient();
	const updated = { adults: 2, children: 1, toddlers: 0 };
	let requests = 0;
	globalThis.fetch = (async (input, init) => {
		requests += 1;
		expect(new URL(String(input)).pathname).toBe("/household");
		expect(init?.method).toBe("PUT");
		return Response.json(updated);
	}) as typeof fetch;

	expect(await saveHousehold(queryClient, updated)).toEqual(updated);
	expect(requests).toBe(1);
	expect(queryClient.getQueryData(householdQueryKey)).toEqual(updated);
});
