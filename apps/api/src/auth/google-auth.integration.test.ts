import { afterAll, expect, spyOn, test } from "bun:test";
import {
	authAccounts,
	authSessions,
	authVerifications,
	createDatabase,
	favorites,
	households,
	inventories,
	kitchens,
	userProfiles,
	users,
} from "@flemme/db";
import { eq, inArray } from "drizzle-orm";
import { createApp } from "../app";
import { createAuthServer } from "./auth-server";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const env = {
	BETTER_AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID(),
	BETTER_AUTH_URL: "http://localhost:3000",
	WEB_ORIGIN: "http://localhost:5173",
	GOOGLE_CLIENT_ID: "a4-test-client",
	GOOGLE_CLIENT_SECRET: "a4-test-secret",
	NODE_ENV: "test",
};
const auth = createAuthServer(db, env);
const app = createApp({
	db,
	authFoundation: { auth, webOrigin: env.WEB_ORIGIN },
});
const addresses: string[] = [];
const states: string[] = [];
afterAll(async () => {
	if (addresses.length)
		await db.delete(users).where(inArray(users.email, addresses));
	if (states.length)
		await db
			.delete(authVerifications)
			.where(inArray(authVerifications.identifier, states));
	await client.end();
});
function identity() {
	const email = `a4-${crypto.randomUUID()}@example.com`;
	addresses.push(email);
	return {
		sub: crypto.randomUUID(),
		email,
		name: "Google Test Cook",
		email_verified: true,
		picture: "https://example.com/test-avatar.png",
	};
}
class CookieJar {
	values = new Map<string, string>();
	async request(
		path: string,
		body?: unknown,
		extra: Record<string, string> = {},
	) {
		const response = await app.request(env.BETTER_AUTH_URL + path, {
			method: body === undefined ? "GET" : "POST",
			headers: {
				Origin: env.WEB_ORIGIN,
				"Content-Type": "application/json",
				Cookie: [...this.values]
					.map(([key, value]) => `${key}=${value}`)
					.join("; "),
				...extra,
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
		});
		for (const cookie of response.headers.getSetCookie()) {
			const pair = cookie.split(";")[0];
			if (!pair) continue;
			const separator = pair.indexOf("=");
			const key = pair.slice(0, separator),
				value = pair.slice(separator + 1);
			if (value) this.values.set(key, value);
			else this.values.delete(key);
		}
		return response;
	}
}
async function initiate(jar: CookieJar) {
	const response = await jar.request("/auth/sign-in/social", {
		provider: "google",
		callbackURL: `${env.WEB_ORIGIN}/`,
		errorCallbackURL: `${env.WEB_ORIGIN}/?auth=error`,
		disableRedirect: true,
	});
	expect(response.status).toBe(200);
	expect(response.headers.get("access-control-allow-origin")).toBe(
		env.WEB_ORIGIN,
	);
	expect(response.headers.get("access-control-allow-credentials")).toBe("true");
	const body = (await response.json()) as { url: string };
	const url = new URL(body.url);
	expect(url.origin).toBe("https://accounts.google.com");
	expect(url.pathname).toBe("/o/oauth2/v2/auth");
	expect(url.searchParams.get("redirect_uri")).toBe(
		`${env.BETTER_AUTH_URL}/auth/callback/google`,
	);
	expect(url.searchParams.get("client_id")).toBe(env.GOOGLE_CLIENT_ID);
	expect(url.searchParams.get("scope")?.split(" ").sort()).toEqual([
		"email",
		"openid",
		"profile",
	]);
	expect(url.searchParams.get("access_type")).toBe("online");
	expect(url.searchParams.get("include_granted_scopes")).not.toBe("true");
	expect(url.searchParams.get("code_challenge_method")).toBe("S256");
	expect(url.searchParams.get("code_challenge")).toBeTruthy();
	const state = url.searchParams.get("state");
	if (!state) throw new Error("Missing OAuth state");
	states.push(state);
	return url;
}
// Intercept only the server-to-Google HTTPS code exchange. No production
// provider, state, cookie, password or database behavior is replaced. The pinned
// code-flow provider consumes claims from this trusted token response; this is
// not a real Google signature/consent acceptance test.
async function callback(
	jar: CookieJar,
	url: URL,
	claims: ReturnType<typeof identity>,
) {
	const encode = (value: unknown) =>
		Buffer.from(JSON.stringify(value)).toString("base64url");
	const idToken = `${encode({ alg: "RS256", typ: "JWT", kid: "test-only" })}.${encode(
		{
			...claims,
			aud: env.GOOGLE_CLIENT_ID,
			iss: "https://accounts.google.com",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		},
	)}.test-only-network-fixture`;
	let exchanges = 0;
	const transport = Object.assign(
		async (input: unknown, init?: { body?: unknown }) => {
			if (String(input) !== "https://oauth2.googleapis.com/token")
				throw new Error("Unexpected OAuth network destination");
			exchanges++;
			const form = new URLSearchParams(String(init?.body));
			expect(form.get("code")).toBe("test-authorization-code");
			expect(form.get("redirect_uri")).toBe(
				`${env.BETTER_AUTH_URL}/auth/callback/google`,
			);
			expect(form.get("client_id")).toBe(env.GOOGLE_CLIENT_ID);
			expect(form.get("client_secret")).toBe(env.GOOGLE_CLIENT_SECRET);
			const verifier = form.get("code_verifier") ?? "";
			const challenge = Buffer.from(
				await crypto.subtle.digest(
					"SHA-256",
					new TextEncoder().encode(verifier),
				),
			).toString("base64url");
			expect(challenge).toBe(url.searchParams.get("code_challenge") ?? "");
			return Response.json({
				access_token: "test-only-access",
				id_token: idToken,
				token_type: "Bearer",
				expires_in: 3600,
				scope: "openid email profile",
			});
		},
		{ preconnect: globalThis.fetch.preconnect },
	);
	const network = spyOn(globalThis, "fetch").mockImplementation(transport);
	try {
		const response = await jar.request(
			`/auth/callback/google?code=test-authorization-code&state=${url.searchParams.get("state")}`,
		);
		expect(exchanges).toBe(1);
		return response;
	} finally {
		network.mockRestore();
	}
}

test("Google callback provisions one UUID identity, restores sessions and preserves returning identity without Product Domain data", async () => {
	const claims = identity();
	const jar = new CookieJar();
	const response = await callback(jar, await initiate(jar), claims);
	expect(response.status).toBe(302);
	expect(response.headers.get("location")).toBe(`${env.WEB_ORIGIN}/`);
	const cookie = response.headers.getSetCookie().join(";");
	expect(cookie).toContain("HttpOnly");
	expect(cookie).toContain("SameSite=Lax");
	expect(cookie).not.toContain("Domain=");
	expect(cookie).not.toContain("Secure");
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, claims.email));
	if (!user) throw new Error("Google user missing");
	expect(user).toMatchObject({
		name: claims.name,
		image: claims.picture,
		emailVerified: true,
	});
	expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
	const accounts = await db
		.select()
		.from(authAccounts)
		.where(eq(authAccounts.userId, user.id));
	expect(accounts).toHaveLength(1);
	expect(accounts[0]).toMatchObject({
		userId: user.id,
		providerId: "google",
		accountId: claims.sub,
		password: null,
		refreshToken: null,
		scope: "openid,email,profile",
	});
	expect(accounts[0]?.accessToken).toBeTruthy();
	expect(accounts[0]?.idToken).toBeTruthy();
	expect(accounts[0]?.accessTokenExpiresAt).toBeInstanceOf(Date);
	const sessions = await db
		.select()
		.from(authSessions)
		.where(eq(authSessions.userId, user.id));
	expect(sessions).toHaveLength(1);
	expect(sessions[0]?.expiresAt.getTime()).toBeGreaterThan(
		Date.now() + 6 * 86400000,
	);
	for (const table of [
		userProfiles,
		households,
		kitchens,
		inventories,
		favorites,
	]) {
		expect(
			await db
				.select({ userId: table.userId })
				.from(table)
				.where(eq(table.userId, user.id)),
		).toHaveLength(0);
	}
	const restored = await (await jar.request("/auth/get-session")).json();
	expect(restored).toMatchObject({
		user: { id: user.id, email: claims.email },
		session: { userId: user.id },
	});
	expect(JSON.stringify(restored)).not.toContain('"token"');
	expect(JSON.stringify(restored)).not.toContain("test-only-access");
	expect((await jar.request("/profile")).status).toBe(401);
	expect(
		(await jar.request("/profile", undefined, { "x-flemme-user-id": user.id }))
			.status,
	).toBe(404);
	for (const path of [
		"/get-access-token",
		"/refresh-token",
		"/link-social",
		"/unlink-account",
	]) {
		expect(
			(
				await jar.request(`/auth${path}`, {
					providerId: "google",
					provider: "google",
				})
			).status,
		).toBe(404);
	}
	const returning = new CookieJar();
	expect(
		(
			await callback(returning, await initiate(returning), {
				...claims,
				name: "Not synchronized",
			})
		).status,
	).toBe(302);
	expect(
		await db.select().from(users).where(eq(users.email, claims.email)),
	).toHaveLength(1);
	expect(
		await db
			.select()
			.from(authAccounts)
			.where(eq(authAccounts.userId, user.id)),
	).toHaveLength(1);
	expect(
		await db
			.select()
			.from(authSessions)
			.where(eq(authSessions.userId, user.id)),
	).toHaveLength(2);
	expect(
		await (await returning.request("/auth/get-session")).json(),
	).toMatchObject({ user: { id: user.id, name: claims.name } });
	expect((await jar.request("/auth/sign-out", {})).status).toBe(200);
	expect(await (await jar.request("/auth/get-session")).json()).toBeNull();
	expect(
		await (await returning.request("/auth/get-session")).json(),
	).toMatchObject({ user: { id: user.id } });
	const duplicate = await new CookieJar().request("/auth/sign-up/email", {
		email: claims.email,
		name: "Password attempt",
		password: "abcdefgh",
	});
	expect(duplicate.status).toBe(422);
	expect(await duplicate.json()).toMatchObject({
		code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
	});
	expect(
		await db
			.select()
			.from(authAccounts)
			.where(eq(authAccounts.userId, user.id)),
	).toHaveLength(1);
});

test("same-email Google callback cannot link or change an existing password identity", async () => {
	const claims = identity();
	const passwordJar = new CookieJar();
	expect(
		(
			await passwordJar.request("/auth/sign-up/email", {
				name: "Password Owner",
				email: claims.email,
				password: "abcdefgh",
			})
		).status,
	).toBe(200);
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, claims.email));
	if (!user) throw new Error("Password user missing");
	const before = await db
		.select()
		.from(authAccounts)
		.where(eq(authAccounts.userId, user.id));
	const jar = new CookieJar();
	const response = await callback(jar, await initiate(jar), claims);
	expect(response.status).toBe(302);
	expect(
		new URL(response.headers.get("location") ?? "").searchParams.get("error"),
	).toBe("account_not_linked");
	expect(
		await db
			.select()
			.from(authAccounts)
			.where(eq(authAccounts.userId, user.id)),
	).toEqual(before);
	expect(
		await db.select().from(users).where(eq(users.email, claims.email)),
	).toEqual([user]);
	expect(
		await db
			.select()
			.from(authSessions)
			.where(eq(authSessions.userId, user.id)),
	).toHaveLength(1);
	expect(await (await jar.request("/auth/get-session")).json()).toBeNull();
	expect(
		await (await passwordJar.request("/auth/get-session")).json(),
	).toMatchObject({ user: { id: user.id, emailVerified: false } });
});

test("redirect/origin/scope/state guards reject unsafe Google flows without provisioning", async () => {
	const jar = new CookieJar();
	for (const key of ["callbackURL", "newUserCallbackURL", "errorCallbackURL"]) {
		const response = await jar.request("/auth/sign-in/social", {
			provider: "google",
			[key]: "https://evil.example/steal",
		});
		expect(response.status).toBe(403);
	}
	const hostile = await jar.request(
		"/auth/sign-in/social",
		{ provider: "google" },
		{ Origin: "https://evil.example" },
	);
	expect(hostile.status).toBe(403);
	expect(hostile.headers.get("access-control-allow-origin")).toBeNull();
	for (const extra of [
		{ scopes: ["https://www.googleapis.com/auth/drive"] },
		{ additionalParams: { access_type: "offline" } },
	]) {
		const response = await jar.request("/auth/sign-in/social", {
			provider: "google",
			...extra,
		});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			code: "GOOGLE_IDENTITY_SCOPES_ONLY",
		});
	}
	const directToken = await jar.request("/auth/sign-in/social", {
		provider: "google",
		idToken: { token: "not-a-google-token" },
	});
	expect(directToken.status).toBeGreaterThanOrEqual(400);
	const url = await initiate(jar);
	const before = await (await auth.$context).adapter.count({
		model: "session",
	});
	const network = spyOn(globalThis, "fetch").mockImplementation(
		Object.assign(
			async () => {
				throw new Error("Invalid OAuth state must not contact Google");
			},
			{ preconnect: globalThis.fetch.preconnect },
		),
	);
	try {
		const response = await new CookieJar().request(
			`/auth/callback/google?code=invalid&state=${url.searchParams.get("state")}`,
		);
		expect(response.status).toBe(302);
		expect(
			new URL(response.headers.get("location") ?? "").searchParams.get("error"),
		).toBe("state_mismatch");
		expect(network).not.toHaveBeenCalled();
	} finally {
		network.mockRestore();
	}
	expect(await (await auth.$context).adapter.count({ model: "session" })).toBe(
		before,
	);
});
