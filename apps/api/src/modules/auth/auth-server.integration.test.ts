import { afterAll, expect, test } from "bun:test";
import { createDatabase, users } from "@flemme/db";
import { eq } from "drizzle-orm";
import { createApp } from "../../app";
import { readAuthEnvironment } from "./auth-environment";
import { createAuthServer } from "./auth-server";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const env = readAuthEnvironment({
	BETTER_AUTH_SECRET: `${crypto.randomUUID()}${crypto.randomUUID()}`,
	BETTER_AUTH_URL: "http://localhost:3000",
	WEB_ORIGIN: "http://localhost:5173",
	GOOGLE_CLIENT_ID: "a4-test-client",
	GOOGLE_CLIENT_SECRET: "a4-test-secret",
	NODE_ENV: "test",
});
const auth = createAuthServer(db, env);
const app = createApp({
	db,
	authFoundation: { auth, webOrigin: env.WEB_ORIGIN },
});
afterAll(() => client.end());
const request = (path: string, init?: RequestInit) =>
	app.request(`http://localhost:3000${path}`, init);

test("production authentication issues secure host-only session cookies", async () => {
	const secureOrigin = "https://web.example.com";
	const secureURL = "https://api.example.com";
	const secureAuth = createAuthServer(db, {
		...env,
		BETTER_AUTH_URL: secureURL,
		WEB_ORIGIN: secureOrigin,
		NODE_ENV: "production",
	});
	const secureApp = createApp({
		authFoundation: { auth: secureAuth, webOrigin: secureOrigin },
		db,
	});
	const email = `a8-secure-${crypto.randomUUID()}@example.com`;
	try {
		const response = await secureApp.request(
			`${secureURL}/auth/sign-up/email`,
			{
				method: "POST",
				headers: { Origin: secureOrigin, "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Secure Cook",
					email,
					password: "abcdefgh",
				}),
			},
		);
		expect(response.status).toBe(200);
		const cookies = response.headers.getSetCookie().join(";");
		expect(cookies).toContain("__Secure-better-auth.session_token=");
		expect(cookies).toContain("Secure");
		expect(cookies).toContain("HttpOnly");
		expect(cookies).toContain("SameSite=Lax");
		expect(cookies).toContain("Path=/");
		expect(cookies).not.toContain("Domain=");
	} finally {
		await db.delete(users).where(eq(users.email, email));
	}
});
test("framework endpoints stay public while product identity requires a session", async () => {
	const response = await request("/auth/get-session");
	expect(response.status).toBe(200);
	expect(await response.json()).toBeNull();
	expect(response.headers.get("set-cookie")).toBeNull();
	expect((await request("/auth/nonexistent")).status).toBe(404);
	expect((await request("/health")).status).toBe(200);
	expect((await request("/profile")).status).toBe(401);
	expect((await request("/auth/me")).status).toBe(401);
});
test("credentialed CORS preflight precedes protected route authentication", async () => {
	for (const path of ["/auth/get-session", "/profile"]) {
		const response = await request(path, {
			method: "OPTIONS",
			headers: {
				Origin: env.WEB_ORIGIN,
				"Access-Control-Request-Method": "POST",
				"Access-Control-Request-Headers": "content-type,x-flemme-user-id",
			},
		});
		expect(response.status).toBe(204);
		expect(response.headers.get("access-control-allow-origin")).toBe(
			env.WEB_ORIGIN,
		);
		expect(response.headers.get("access-control-allow-credentials")).toBe(
			"true",
		);
		expect(response.headers.get("access-control-allow-headers")).toBe(
			"Content-Type",
		);
	}
	const allowed = await request("/auth/get-session", {
		headers: { Origin: env.WEB_ORIGIN },
	});
	expect(allowed.headers.get("access-control-allow-origin")).toBe(
		env.WEB_ORIGIN,
	);
	const denied = await request("/auth/get-session", {
		headers: { Origin: "https://evil.example" },
	});
	expect(denied.headers.get("access-control-allow-origin")).toBeNull();
	const deniedPreflight = await request("/profile", {
		method: "OPTIONS",
		headers: {
			Origin: "https://evil.example",
			"Access-Control-Request-Method": "PUT",
		},
	});
	expect(deniedPreflight.headers.get("access-control-allow-origin")).toBeNull();
	const deniedMutation = await request("/auth/sign-out", {
		method: "POST",
		headers: {
			Origin: "https://evil.example",
			"Content-Type": "application/json",
			Cookie: "unrelated=csrf-test",
		},
		body: JSON.stringify({
			email: "test@example.com",
			password: "not-a-login",
		}),
	});
	expect(deniedMutation.status).toBe(403);
});
