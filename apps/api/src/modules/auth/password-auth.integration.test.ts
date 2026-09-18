import { afterAll, expect, test } from "bun:test";
import {
	authAccounts,
	authSessions,
	createDatabase,
	favorites,
	households,
	inventories,
	kitchens,
	userProfiles,
	users,
} from "@flemme/db";
import { and, eq, inArray } from "drizzle-orm";
import { createApp } from "../../app";
import { createAuthServer } from "./auth-server";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const origin = "http://localhost:5173";
const baseURL = Bun.env.A3_RUNTIME_URL ?? "http://localhost:3000";
const auth = createAuthServer(db, {
	BETTER_AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID(),
	BETTER_AUTH_URL: baseURL,
	WEB_ORIGIN: origin,
	GOOGLE_CLIENT_ID: "a4-test-client",
	GOOGLE_CLIENT_SECRET: "a4-test-secret",
	NODE_ENV: "test",
});
const app = createApp({
	db,
	authFoundation: { auth, webOrigin: origin },
});
const createdEmails: string[] = [];
const legacySessionIds: string[] = [];
afterAll(async () => {
	if (legacySessionIds.length)
		await db
			.delete(authSessions)
			.where(inArray(authSessions.id, legacySessionIds));
	if (createdEmails.length)
		await db.delete(users).where(inArray(users.email, createdEmails));
	await client.end();
});
function email() {
	const value = `a3-${crypto.randomUUID()}@example.com`;
	createdEmails.push(value);
	return value;
}
class CookieJar {
	values = new Map<string, string>();
	async request(
		path: string,
		body?: unknown,
		extra: Record<string, string> = {},
	) {
		const headers = {
			Origin: origin,
			"Content-Type": "application/json",
			Cookie: [...this.values].map(([k, v]) => `${k}=${v}`).join("; "),
			...extra,
		};
		const init = {
			method: body === undefined ? "GET" : "POST",
			headers,
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
		};
		const response = Bun.env.A3_RUNTIME_URL
			? await fetch(baseURL + path, init)
			: await app.request(baseURL + path, init);
		for (const cookie of response.headers.getSetCookie()) {
			const pair = cookie.split(";")[0];
			if (!pair) continue;
			const split = pair.indexOf("=");
			const key = pair.slice(0, split),
				value = pair.slice(split + 1);
			if (!value) this.values.delete(key);
			else this.values.set(key, value);
		}
		return response;
	}
}
async function json(response: Response): Promise<Record<string, unknown>> {
	return (await response.json()) as Record<string, unknown>;
}

test("registration persists UUID identity, Argon2 credential/session; restore/logout preserves domain boundary", async () => {
	const jar = new CookieJar();
	const address = email();
	const password = "abcdefgh";
	const response = await jar.request("/auth/sign-up/email", {
		name: "Rahmat",
		email: `  ${address.toUpperCase()}  `,
		password,
	});
	expect(response.status).toBe(200);
	const data = await json(response);
	expect(data.token).toBeUndefined();
	const [user] = await db.select().from(users).where(eq(users.email, address));
	if (!user) throw new Error("Registration user missing");
	expect(data.user).toMatchObject({
		id: user.id,
		email: address,
		name: "Rahmat",
		emailVerified: false,
	});
	expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
	const [account] = await db
		.select()
		.from(authAccounts)
		.where(eq(authAccounts.userId, user.id));
	expect(account).toMatchObject({
		userId: user.id,
		accountId: user.id,
		providerId: "credential",
	});
	expect(account?.password?.startsWith("$argon2id$")).toBe(true);
	expect(await Bun.password.verify(password, account?.password ?? "")).toBe(
		true,
	);
	const sessions = await db
		.select()
		.from(authSessions)
		.where(eq(authSessions.userId, user.id));
	expect(sessions).toHaveLength(1);
	const session = sessions[0];
	expect(session?.expiresAt.getTime()).toBeGreaterThan(
		Date.now() + 6 * 86400000,
	);
	expect(session?.createdAt).toBeInstanceOf(Date);
	expect(session?.updatedAt).toBeInstanceOf(Date);
	const cookies = response.headers.getSetCookie().join(";");
	expect(cookies).toContain("HttpOnly");
	expect(cookies).toContain("SameSite=Lax");
	expect(cookies).not.toContain("Domain=");
	expect(cookies).not.toContain("Secure");
	expect(response.headers.get("access-control-allow-origin")).toBe(origin);
	for (const table of [
		userProfiles,
		households,
		kitchens,
		inventories,
		favorites,
	])
		expect(
			await db.select().from(table).where(eq(table.userId, user.id)),
		).toHaveLength(0);
	const restored = await json(await jar.request("/auth/get-session"));
	expect(restored.user).toMatchObject({ id: user.id });
	expect(restored.session).toMatchObject({ id: session?.id, userId: user.id });
	expect((restored.session as Record<string, unknown>).token).toBeUndefined();
	expect(await (await jar.request("/auth/me")).json()).toEqual({
		user: { id: user.id, email: address, name: "Rahmat", image: null },
	});
	expect((await jar.request("/profile")).status).toBe(404);
	for (const duplicate of [address, address.toUpperCase()]) {
		const duplicateResponse = await new CookieJar().request(
			"/auth/sign-up/email",
			{ name: "Other", email: duplicate, password },
		);
		expect(duplicateResponse.status).toBe(422);
		expect(await json(duplicateResponse)).toMatchObject({
			code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
		});
	}
	expect(
		await db.select().from(users).where(eq(users.email, address)),
	).toHaveLength(1);
	expect(
		await db
			.select()
			.from(authAccounts)
			.where(eq(authAccounts.userId, user.id)),
	).toHaveLength(1);
	const oldCookie = [...jar.values].map(([k, v]) => `${k}=${v}`).join("; ");
	const logout = await jar.request("/auth/sign-out", {});
	expect(logout.status).toBe(200);
	expect(logout.headers.getSetCookie().join(";")).toContain("Max-Age=0");
	expect(
		await db
			.select()
			.from(authSessions)
			.where(eq(authSessions.userId, user.id)),
	).toHaveLength(0);
	expect(await (await jar.request("/auth/get-session")).json()).toBeNull();
	expect(
		await (
			await new CookieJar().request("/auth/get-session", undefined, {
				Cookie: oldCookie,
			})
		).json(),
	).toBeNull();
	const unrelated = new CookieJar();
	const unrelatedEmail = email();
	expect(
		(
			await unrelated.request("/auth/sign-up/email", {
				name: "Independent",
				email: unrelatedEmail,
				password,
			})
		).status,
	).toBe(200);
	const login = await jar.request("/auth/sign-in/email", {
		email: ` ${address.toUpperCase()} `,
		password,
	});
	expect(login.status).toBe(200);
	expect((await json(login)).token).toBeUndefined();
	const another = new CookieJar();
	expect(
		(await another.request("/auth/sign-in/email", { email: address, password }))
			.status,
	).toBe(200);
	expect(
		await db
			.select()
			.from(authSessions)
			.where(eq(authSessions.userId, user.id)),
	).toHaveLength(2);
	await jar.request("/auth/sign-out", {});
	expect(
		(await json(await another.request("/auth/get-session"))).user,
	).toMatchObject({ id: user.id });
	await another.request("/auth/sign-out", {});
	expect(
		(await json(await unrelated.request("/auth/get-session"))).user,
	).toMatchObject({ email: unrelatedEmail });
	await unrelated.request("/auth/sign-out", {});
});

test("password boundaries, invalid registration, generic credential failures and hostile origin", async () => {
	for (const length of [7, 8, 128, 129]) {
		const jar = new CookieJar();
		const response = await jar.request("/auth/sign-up/email", {
			name: "Boundary",
			email: email(),
			password: "a".repeat(length),
		});
		expect(response.status).toBe(length === 8 || length === 128 ? 200 : 400);
		if (response.ok) await jar.request("/auth/sign-out", {});
	}
	for (const body of [
		{ email: email(), password: "abcdefgh" },
		{ name: "Invalid", email: "bad", password: "abcdefgh" },
	])
		expect(
			(await new CookieJar().request("/auth/sign-up/email", body)).status,
		).toBe(400);
	const address = email();
	const jar = new CookieJar();
	await jar.request("/auth/sign-up/email", {
		name: "User",
		email: address,
		password: "abcdefgh",
	});
	const wrong = await new CookieJar().request("/auth/sign-in/email", {
		email: address,
		password: "wrong-password",
	});
	const unknown = await new CookieJar().request("/auth/sign-in/email", {
		email: email(),
		password: "wrong-password",
	});
	expect(wrong.status).toBe(401);
	expect(unknown.status).toBe(401);
	expect(await json(wrong)).toEqual(await json(unknown));
	const denied = await jar.request(
		"/auth/sign-up/email",
		{ name: "Blocked", email: email(), password: "abcdefgh" },
		{ Origin: "https://evil.example" },
	);
	expect(denied.status).toBe(403);
	expect(denied.headers.get("access-control-allow-origin")).toBeNull();
	await jar.request("/auth/sign-out", {});
});

test("migrated seed login preserves UUID/hash and does not revoke unrelated sessions", async () => {
	const [seed] = await db
		.select({ user: users, account: authAccounts })
		.from(users)
		.innerJoin(authAccounts, eq(users.id, authAccounts.userId))
		.where(
			and(
				eq(
					users.email,
					(Bun.env.DEV_USER_EMAIL ?? "dev@flemme.local").toLowerCase(),
				),
				eq(authAccounts.providerId, "credential"),
			),
		);
	if (!seed)
		throw new Error(
			"A3 legacy acceptance requires the migrated development seed; do not reseed to bypass this check",
		);
	const before = await db
		.select()
		.from(authSessions)
		.where(eq(authSessions.userId, seed.user.id));
	const jar = new CookieJar();
	const response = await jar.request("/auth/sign-in/email", {
		email: seed.user.email,
		password: Bun.env.DEV_USER_PASSWORD ?? "flemme-local-development",
	});
	const after = await db
		.select()
		.from(authSessions)
		.where(eq(authSessions.userId, seed.user.id));
	legacySessionIds.push(
		...after
			.filter((row) => !before.some((old) => old.id === row.id))
			.map((row) => row.id),
	);
	expect(response.status).toBe(200);
	expect((await json(response)).user).toMatchObject({ id: seed.user.id });
	expect(
		(await json(await jar.request("/auth/get-session"))).user,
	).toMatchObject({ id: seed.user.id });
	const [credential] = await db
		.select()
		.from(authAccounts)
		.where(eq(authAccounts.id, seed.account.id));
	expect(credential?.password).toBe(seed.account.password);
	await jar.request("/auth/sign-out", {});
	expect(
		await db
			.select()
			.from(authSessions)
			.where(eq(authSessions.userId, seed.user.id)),
	).toEqual(before);
	expect(await (await jar.request("/auth/get-session")).json()).toBeNull();
});

test("built-in password endpoint limiter rejects excess requests", async () => {
	let last: Response | undefined;
	for (let i = 0; i < 21; i++) {
		last = await new CookieJar().request("/auth/sign-in/email", {});
		if (last.status === 429) break;
	}
	expect(last?.status).toBe(429);
	expect(last?.headers.get("x-retry-after")).not.toBeNull();
});
