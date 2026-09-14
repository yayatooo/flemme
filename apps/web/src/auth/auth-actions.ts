import type { QueryClient } from "@tanstack/react-query";
import { type BrowserAuthOperations, browserAuth } from "./auth-client";
import { authQueryKey, authQueryOptions } from "./auth-query";

export class AuthActionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthActionError";
	}
}

export function clearUserSessionState(queryClient: QueryClient) {
	queryClient.clear();
	queryClient.setQueryData(authQueryKey, null);
}
export function handleUnauthorized(queryClient: QueryClient) {
	clearUserSessionState(queryClient);
	if (typeof window !== "undefined") window.location.assign("/login");
}

export async function refreshAuthenticatedUser(queryClient: QueryClient) {
	await queryClient.invalidateQueries({ queryKey: authQueryKey });
	const user = await queryClient.fetchQuery(authQueryOptions);
	if (!user) throw new AuthActionError("Your session could not be restored.");
	return user;
}

function loginError(status?: number) {
	if (status === 429) return "Too many attempts. Please wait and try again.";
	if (status && status >= 500)
		return "Flemme is unavailable right now. Please try again.";
	return "Email or password is incorrect.";
}

export async function signInWithEmail(
	queryClient: QueryClient,
	input: { email: string; password: string },
	operations: BrowserAuthOperations = browserAuth,
) {
	const result = await operations.signInEmail(input);
	if (result.error) throw new AuthActionError(loginError(result.error.status));
	return refreshAuthenticatedUser(queryClient);
}

export async function registerWithEmail(
	queryClient: QueryClient,
	input: { name: string; email: string; password: string },
	operations: BrowserAuthOperations = browserAuth,
) {
	const result = await operations.signUpEmail(input);
	if (result.error) {
		if (result.error.status === 429) {
			throw new AuthActionError(
				"Too many attempts. Please wait and try again.",
			);
		}
		throw new AuthActionError(
			"Registration failed. Check your details and try again.",
		);
	}
	return refreshAuthenticatedUser(queryClient);
}

export async function signOut(
	queryClient: QueryClient,
	operations: BrowserAuthOperations = browserAuth,
) {
	const result = await operations.signOut();
	if (result.error)
		throw new AuthActionError("Unable to sign out. Please try again.");
	clearUserSessionState(queryClient);
}

export async function signInWithGoogle(
	operations: BrowserAuthOperations = browserAuth,
) {
	const result = await operations.signInGoogle({
		callbackURL: `${window.location.origin}/app`,
		errorCallbackURL: `${window.location.origin}/login`,
	});
	if (result.error)
		throw new AuthActionError("Unable to continue with Google.");
}
