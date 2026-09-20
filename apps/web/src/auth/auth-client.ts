import { createAuthClient } from "better-auth/react";
import { API_ORIGIN } from "../config";

export const authClient = createAuthClient({
	baseURL: API_ORIGIN,
	basePath: "/api/auth",
	fetchOptions: { credentials: "include" },
});
export interface BrowserAuthOperations {
	signInEmail(input: { email: string; password: string }): Promise<{
		error: { status: number } | null;
	}>;
	signUpEmail(input: {
		name: string;
		email: string;
		password: string;
	}): Promise<{ error: { status: number } | null }>;
	signOut(): Promise<{ error: { status: number } | null }>;
	signInGoogle(input: {
		callbackURL: string;
		errorCallbackURL: string;
	}): Promise<{ error: { status: number } | null }>;
}

export const browserAuth: BrowserAuthOperations = {
	signInEmail: (input) => authClient.signIn.email(input),
	signUpEmail: (input) => authClient.signUp.email(input),
	signOut: () => authClient.signOut(),
	signInGoogle: ({ callbackURL, errorCallbackURL }) =>
		authClient.signIn.social({
			provider: "google",
			callbackURL,
			errorCallbackURL,
		}),
};
