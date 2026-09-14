import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
	AuthActionError,
	registerWithEmail,
	signInWithEmail,
	signOut,
} from "./auth-actions";
import type { BrowserAuthOperations } from "./auth-client";
import { authQueryKey } from "./auth-query";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

const user = {
	id: "4581682e-167f-4a8e-aecd-043d098df04f",
	email: "cook@example.com",
};
const successfulOperations: BrowserAuthOperations = {
	signInEmail: async () => ({ error: null }),
	signUpEmail: async () => ({ error: null }),
	signOut: async () => ({ error: null }),
	signInGoogle: async () => ({ error: null }),
};

function installCurrentUserFetch() {
	globalThis.fetch = (async () => Response.json({ user })) as typeof fetch;
}

test("restores identity after password login and registration", async () => {
	installCurrentUserFetch();
	const loginClient = new QueryClient();
	expect(
		await signInWithEmail(
			loginClient,
			{ email: user.email, password: "abcdefgh" },
			successfulOperations,
		),
	).toEqual(user);
	expect(loginClient.getQueryData(authQueryKey)).toEqual(user);

	installCurrentUserFetch();
	const registerClient = new QueryClient();
	expect(
		await registerWithEmail(
			registerClient,
			{ name: "Cook", email: user.email, password: "abcdefgh" },
			successfulOperations,
		),
	).toEqual(user);
	expect(registerClient.getQueryData(authQueryKey)).toEqual(user);
});

test("uses one generic login error for rejected credentials", async () => {
	await expect(
		signInWithEmail(
			new QueryClient(),
			{ email: "known@example.com", password: "wrong-password" },
			{
				...successfulOperations,
				signInEmail: async () => ({ error: { status: 401 } }),
			},
		),
	).rejects.toEqual(new AuthActionError("Email or password is incorrect."));
});

test("server logout clears Auth and user-scoped query data", async () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(authQueryKey, user);
	queryClient.setQueryData(["profile"], { foodPreferences: ["savory"] });

	await signOut(queryClient, successfulOperations);

	expect(queryClient.getQueryData(authQueryKey)).toBeNull();
	expect(queryClient.getQueryData(["profile"])).toBeUndefined();
});
