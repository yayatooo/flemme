import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { FlemmeApiError } from "../api/api-client";
import {
	buildProfilePayload,
	cookingPreferenceOptions,
	emptyProfile,
	foodPreferenceOptions,
	type ProfileState,
	preferenceOptionsWithPersistedValues,
	profileErrorMessage,
	profileQueryKey,
	profileQueryOptions,
	saveProfileAndResolveNext,
	togglePreferenceValue,
} from "./profile-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function json(payload: unknown, status = 200) {
	return Response.json(payload, { status });
}

test("missing Profile renders a valid empty state without persisting", async () => {
	let method: string | undefined;
	globalThis.fetch = (async (_input, init) => {
		method = init?.method;
		return json(
			{ error: { code: "PROFILE_NOT_FOUND", message: "Profile not found" } },
			404,
		);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	const profile = await queryClient.fetchQuery(
		profileQueryOptions(queryClient),
	);

	expect(profile).toBeNull();
	expect(profile ?? emptyProfile).toEqual({
		foodPreferences: [],
		cookingPreferences: [],
	});
	expect(method).toBeUndefined();
});

test("existing Profile prepopulates both preference arrays", async () => {
	const persisted: ProfileState = {
		foodPreferences: ["spicy", "savory"],
		cookingPreferences: ["quick", "simple"],
	};
	globalThis.fetch = (async () => json(persisted)) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await queryClient.fetchQuery(profileQueryOptions(queryClient)),
	).toEqual(persisted);
});

test("food and cooking preferences toggle independently", () => {
	expect(togglePreferenceValue([], "spicy")).toEqual(["spicy"]);
	expect(togglePreferenceValue(["spicy"], "spicy")).toEqual([]);
	expect(togglePreferenceValue(["quick"], "one-pan")).toEqual([
		"quick",
		"one-pan",
	]);
});

test("Continue and Skip build full replacement payloads", () => {
	expect(buildProfilePayload(["asian", "savory"], ["simple"])).toEqual({
		foodPreferences: ["asian", "savory"],
		cookingPreferences: ["simple"],
	});
	expect(buildProfilePayload([], [])).toEqual({
		foodPreferences: [],
		cookingPreferences: [],
	});
});

test("existing non-vocabulary values remain visible and editable", () => {
	expect(
		preferenceOptionsWithPersistedValues(foodPreferenceOptions, [
			"savory",
			"vegetable-forward",
		]),
	).toContainEqual({ value: "vegetable-forward", label: "vegetable-forward" });
	expect(
		preferenceOptionsWithPersistedValues(cookingPreferenceOptions, [
			"simple meals",
		]),
	).toContainEqual({ value: "simple meals", label: "simple meals" });
});

test("successful save updates Profile cache and advances a fresh user to Household", async () => {
	const payload = buildProfilePayload(["spicy"], ["quick"]);
	const requests: Array<{ path: string; method: string }> = [];
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		requests.push({ path, method: init?.method ?? "GET" });
		if (path === "/profile" && init?.method === "PUT") return json(payload);
		if (path === "/profile") return json(payload);
		return json(
			{
				error: {
					code:
						path === "/household"
							? "HOUSEHOLD_NOT_FOUND"
							: path === "/kitchen"
								? "KITCHEN_NOT_FOUND"
								: "INVENTORY_NOT_FOUND",
					message: "Missing",
				},
			},
			404,
		);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	expect(
		await saveProfileAndResolveNext(
			queryClient,
			payload,
			"/onboarding/profile",
		),
	).toBe("/onboarding/household");
	expect(queryClient.getQueryData(profileQueryKey)).toEqual(payload);
	expect(requests[0]).toEqual({ path: "/profile", method: "PUT" });
});

test("save recomputes and navigates to the actual incomplete step", async () => {
	const payload = buildProfilePayload([], []);
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		if (path === "/profile" && init?.method === "PUT") return json(payload);
		if (path === "/kitchen") {
			return json(
				{ error: { code: "KITCHEN_NOT_FOUND", message: "Missing" } },
				404,
			);
		}
		return json({ ok: true });
	}) as typeof fetch;

	expect(
		await saveProfileAndResolveNext(
			new QueryClient(),
			payload,
			"/onboarding/profile",
		),
	).toBe("/onboarding/kitchen");
});

test("save resolves a complete user to app", async () => {
	const payload = buildProfilePayload([], []);
	globalThis.fetch = (async (input, init) => {
		const path = new URL(String(input)).pathname;
		if (path === "/profile" && init?.method === "PUT") return json(payload);
		return json({ ok: true });
	}) as typeof fetch;

	expect(
		await saveProfileAndResolveNext(
			new QueryClient(),
			payload,
			"/onboarding/profile",
		),
	).toBe("/app");
});

test("failed PUT neither updates cache nor computes navigation", async () => {
	let getCount = 0;
	globalThis.fetch = (async (_input, init) => {
		if (init?.method !== "PUT") getCount += 1;
		return json(
			{ error: { code: "PROFILE_SAVE_FAILED", message: "Could not save" } },
			500,
		);
	}) as typeof fetch;
	const queryClient = new QueryClient();

	await expect(
		saveProfileAndResolveNext(
			queryClient,
			buildProfilePayload(["sweet"], ["grilled"]),
			"/onboarding/profile",
		),
	).rejects.toMatchObject({ code: "PROFILE_SAVE_FAILED" });
	expect(queryClient.getQueryData(profileQueryKey)).toBeUndefined();
	expect(getCount).toBe(0);
});

test("unexpected GET and API errors remain real error states", async () => {
	globalThis.fetch = (async () =>
		json(
			{ error: { code: "INTERNAL_SERVER_ERROR", message: "Unavailable" } },
			500,
		)) as typeof fetch;
	const queryClient = new QueryClient();

	await expect(
		queryClient.fetchQuery(profileQueryOptions(queryClient)),
	).rejects.toMatchObject({ status: 500, code: "INTERNAL_SERVER_ERROR" });
	expect(
		profileErrorMessage(
			new FlemmeApiError(422, "INVALID_PROFILE", "Choose valid preferences"),
		),
	).toBe("Choose valid preferences");
});
