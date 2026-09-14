import { afterEach, expect, test } from "bun:test";
import { FlemmeApiError, requestApi } from "./api-client";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("sends credentialed requests and parses Flemme errors", async () => {
	let credentials: RequestCredentials | undefined;
	globalThis.fetch = (async (_input, init) => {
		credentials = init?.credentials;
		return Response.json({ items: [] });
	}) as typeof fetch;

	expect(await requestApi<{ items: [] }>("/inventory")).toEqual({ items: [] });
	expect(credentials).toBe("include");

	let invalidated = false;
	globalThis.fetch = (async () =>
		Response.json(
			{
				error: {
					code: "UNAUTHENTICATED",
					message: "Authentication is required",
				},
			},
			{ status: 401 },
		)) as typeof fetch;
	const failure = requestApi("/profile", undefined, () => {
		invalidated = true;
	});
	await expect(failure).rejects.toMatchObject({
		status: 401,
		code: "UNAUTHENTICATED",
	});
	expect(invalidated).toBe(true);
});

test("keeps network failures separate from server errors", async () => {
	globalThis.fetch = (async () => {
		throw new TypeError("offline");
	}) as typeof fetch;
	await expect(requestApi("/profile")).rejects.toEqual(
		new FlemmeApiError(0, "NETWORK_ERROR", "Unable to reach Flemme"),
	);
});
