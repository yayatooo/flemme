import type { FlemmeDatabase } from "@flemme/db";
import { z } from "zod";
import { createAuthServer } from "../modules/auth/auth-server";

const SignupResponseSchema = z.object({
	user: z.object({ id: z.uuid() }),
});

export function createSessionAuth(db: FlemmeDatabase) {
	const webOrigin = "http://localhost:5173";
	const baseURL = "http://localhost:3000";
	const auth = createAuthServer(db, {
		BETTER_AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID(),
		BETTER_AUTH_URL: baseURL,
		WEB_ORIGIN: webOrigin,
		GOOGLE_CLIENT_ID: "domain-test-client",
		GOOGLE_CLIENT_SECRET: "domain-test-secret",
		NODE_ENV: "test",
	});
	const cookies = new Map<string, string>();

	return {
		authFoundation: { auth, webOrigin },
		async createUser() {
			const response = await auth.api.signUpEmail({
				asResponse: true,
				headers: new Headers({ Origin: webOrigin }),
				body: {
					name: "Domain integration fixture",
					email: `domain-${crypto.randomUUID()}@example.com`,
					password: crypto.randomUUID(),
				},
			});
			if (!response.ok) {
				throw new Error(`Fixture signup failed with status ${response.status}`);
			}
			const { user } = SignupResponseSchema.parse(await response.json());
			const cookie = response.headers
				.getSetCookie()
				.map((value) => value.split(";")[0])
				.join("; ");
			if (!cookie)
				throw new Error("Fixture signup did not establish a session");
			// Reuse the real signup session for subsequent domain requests. Callers
			// delete their users after the suite; Auth rows cascade with them.
			cookies.set(user.id, cookie);
			return user.id;
		},
		headers(userId: string) {
			const cookie = cookies.get(userId);
			if (!cookie) throw new Error("No authenticated fixture for this user");
			return { "content-type": "application/json", Cookie: cookie };
		},
	};
}
