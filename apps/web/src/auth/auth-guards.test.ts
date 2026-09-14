import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
	redirectAuthenticatedUser,
	requireAuthenticatedUser,
} from "./auth-guards";
import { authQueryKey } from "./auth-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

test("redirects unauthenticated users from protected routes", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(authQueryKey, null);
	await expect(requireAuthenticatedUser(queryClient)).rejects.toMatchObject({
		options: { to: "/login" },
	});
});

test("redirects authenticated users away from guest routes", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(authQueryKey, {
		id: "4581682e-167f-4a8e-aecd-043d098df04f",
		email: "cook@example.com",
	});
	await expect(redirectAuthenticatedUser(queryClient)).rejects.toMatchObject({
		options: { to: "/app" },
	});
});

test("waits for session restoration before deciding navigation", async () => {
	let release: ((response: Response) => void) | undefined;
	globalThis.fetch = (() =>
		new Promise<Response>((resolve) => {
			release = resolve;
		})) as typeof fetch;
	const queryClient = new QueryClient();
	let settled = false;
	const decision = requireAuthenticatedUser(queryClient).finally(() => {
		settled = true;
	});

	await Promise.resolve();
	expect(settled).toBe(false);
	release?.(
		Response.json({
			user: {
				id: "4581682e-167f-4a8e-aecd-043d098df04f",
				email: "cook@example.com",
			},
		}),
	);
	await expect(decision).resolves.toMatchObject({ email: "cook@example.com" });
});
