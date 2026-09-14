import { afterAll, expect, test } from "bun:test";
import { authAccounts, createDatabase, users } from "@flemme/db";
import { and, eq } from "drizzle-orm";
import { createApp } from "../app";
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

test("initializes official adapter and resolves all four migrated models", async () => {
	const ctx = await auth.$context;
	for (const model of ["user", "account", "session", "verification"]) {
		expect(await ctx.adapter.findMany({ model, limit: 1 })).toBeArray();
		expect(ctx.generateId({ model })).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	}
	expect(ctx.options.session?.expiresIn).toBe(604800);
	expect(ctx.options.session?.updateAge).toBe(86400);
	expect(ctx.options.session?.cookieCache?.enabled).toBe(false);
	expect(ctx.options.account?.accountLinking?.disableImplicitLinking).toBe(
		true,
	);
	expect(ctx.options.account?.accountLinking?.enabled).toBe(false);
	expect(ctx.trustedOrigins).toContain(env.WEB_ORIGIN);
	expect(ctx.trustedOrigins).not.toContain("https://evil.example");
	expect(ctx.authCookies.sessionToken.attributes).toMatchObject({
		httpOnly: true,
		sameSite: "lax",
		secure: false,
		path: "/",
	});
	expect(ctx.authCookies.sessionToken.attributes.domain).toBeUndefined();
	const secure = await createAuthServer(db, {
		...env,
		BETTER_AUTH_URL: "https://api.example.com",
		WEB_ORIGIN: "https://web.example.com",
		NODE_ENV: "production",
	}).$context;
	expect(secure.authCookies.sessionToken.attributes.secure).toBe(true);
});
test("mounted framework returns unauthenticated null without creating sessions", async () => {
	const before = await (await auth.$context).adapter.count({
		model: "session",
	});
	const response = await request("/auth/get-session");
	expect(response.status).toBe(200);
	expect(await response.json()).toBeNull();
	expect(response.headers.get("set-cookie")).toBeNull();
	expect(await (await auth.$context).adapter.count({ model: "session" })).toBe(
		before,
	);
	expect((await request("/auth/nonexistent")).status).toBe(404);
	expect((await request("/health")).status).toBe(200);
	expect((await request("/profile")).status).toBe(401);
});
test("credentialed CORS preflight precedes protected route authentication", async () => {
	for (const path of ["/auth/get-session", "/profile"]) {
		const response = await request(path, {
			method: "OPTIONS",
			headers: {
				Origin: env.WEB_ORIGIN,
				"Access-Control-Request-Method": "POST",
				"Access-Control-Request-Headers": "content-type",
			},
		});
		expect(response.status).toBe(204);
		expect(response.headers.get("access-control-allow-origin")).toBe(
			env.WEB_ORIGIN,
		);
		expect(response.headers.get("access-control-allow-credentials")).toBe(
			"true",
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
test("Google provider resolves with identity-only authorization options", async () => {
	const ctx = await auth.$context;
	expect(ctx.socialProviders).toHaveLength(1);
	expect(ctx.socialProviders[0]?.id).toBe("google");
	expect(ctx.socialProviders[0]?.options).toMatchObject({
		accessType: "online",
		includeGrantedScopes: false,
		scope: ["openid", "email", "profile"],
		disableIdTokenSignIn: true,
	});
});
test("development header remains independent of framework sessions", async () => {
	const [user] = await db
		.insert(users)
		.values({ email: `a2-${crypto.randomUUID()}@flemme.local` })
		.returning();
	if (!user) throw new Error("Missing test user");
	try {
		const headers = { "x-flemme-user-id": user.id };
		expect(
			await (await request("/auth/get-session", { headers })).json(),
		).toBeNull();
		expect((await request("/profile", { headers })).status).toBe(404);
	} finally {
		await db.delete(users).where(eq(users.id, user.id));
	}
});
test("configured password hooks verify an existing credential without HTTP login", async () => {
	const [seed] = await db
		.select({ hash: authAccounts.password })
		.from(authAccounts)
		.innerJoin(users, eq(users.id, authAccounts.userId))
		.where(
			and(
				eq(
					users.email,
					(Bun.env.DEV_USER_EMAIL ?? "dev@flemme.local").toLowerCase(),
				),
				eq(authAccounts.providerId, "credential"),
			),
		);
	if (!seed?.hash) return; // Fresh CI databases need no development seed.
	const ctx = await auth.$context;
	expect(
		await ctx.password.verify({
			password: Bun.env.DEV_USER_PASSWORD ?? "flemme-local-development",
			hash: seed.hash,
		}),
	).toBe(true);
	expect(
		await ctx.password.verify({ password: "wrong-password", hash: seed.hash }),
	).toBe(false);
});
