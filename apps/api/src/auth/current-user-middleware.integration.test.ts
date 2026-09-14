import { afterAll, expect, test } from "bun:test";
import type {
	CookingRecommendationInput,
	CookingRecommendationOutput,
	PreCookingOutput,
} from "@flemme/agent";
import { authSessions, createDatabase, users } from "@flemme/db";
import { eq } from "drizzle-orm";
import { createApp } from "../app";
import { createAuthServer } from "./auth-server";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const { db, client } = createDatabase(Bun.env.DATABASE_URL);
const origin = "http://localhost:5173";
const baseURL = "http://localhost:3000";
const auth = createAuthServer(db, {
	BETTER_AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID(),
	BETTER_AUTH_URL: baseURL,
	WEB_ORIGIN: origin,
	GOOGLE_CLIENT_ID: "a5-test-client",
	GOOGLE_CLIENT_SECRET: "a5-test-secret",
	NODE_ENV: "test",
});
let capturedRecommendationContext: CookingRecommendationInput | undefined;
const recommendationOutput: CookingRecommendationOutput = {
	type: "recommendations",
	recommendations: [
		{
			name: "A5 Session Dish",
			description: "A session-bound acceptance fixture.",
			reason: "It uses persistent cooking context.",
			estimatedDuration: { minMinutes: 10, maxMinutes: 20 },
			servings: 2,
			feasibility: "ready",
			ingredients: [
				{ name: "egg", status: "available", requiredAmount: "2 pcs" },
			],
			equipment: [{ name: "wok", status: "available" }],
			preferenceMatches: ["savory"],
			requiredConfirmations: [],
			optionalIngredients: [],
			warnings: [],
		},
	],
};
const selectedRecipe = recommendationOutput.recommendations[0];
if (!selectedRecipe) throw new Error("A5 recommendation fixture missing");
const cookingPlan: PreCookingOutput = {
	preparationSummary: { overview: "Prepare the A5 session dish." },
	ingredients: [{ name: "egg", quantity: 2, unit: "pcs" }],
	equipment: [{ name: "wok", required: true }],
	preparationSteps: [{ id: "prepare-egg", instruction: "Prepare the eggs." }],
	cookingStages: [
		{
			id: "cook-dish",
			title: "Cook",
			steps: [{ id: "cook-egg", instruction: "Cook the eggs." }],
		},
	],
};
const cookingSessionRequest = {
	recommendationSnapshot: recommendationOutput,
	selectedRecipeSnapshot: selectedRecipe,
	cookingPlan,
	session: {
		status: "active" as const,
		currentStageId: "cook-dish",
		currentStepId: "cook-egg",
		completedStepIds: ["prepare-egg"],
		changes: [],
	},
};
const sessionApp = createApp({
	authFoundation: { auth, webOrigin: origin },
	db,
	recommendationRunner: async (context) => {
		capturedRecommendationContext = context;
		return recommendationOutput;
	},
});
const address = `a5-${crypto.randomUUID()}@example.com`;
const otherAddress = `a5-other-${crypto.randomUUID()}@example.com`;

class CookieJar {
	readonly values = new Map<string, string>();

	get header() {
		return [...this.values].map(([key, value]) => `${key}=${value}`).join("; ");
	}

	async request(
		path: string,
		body?: unknown,
		extra: Record<string, string> = {},
	) {
		const response = await sessionApp.request(baseURL + path, {
			method: body === undefined ? "GET" : "POST",
			headers: {
				Origin: origin,
				"Content-Type": "application/json",
				Cookie: this.header,
				...extra,
			},
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
		});
		for (const cookie of response.headers.getSetCookie()) {
			const pair = cookie.split(";")[0];
			if (!pair) continue;
			const separator = pair.indexOf("=");
			const key = pair.slice(0, separator);
			const value = pair.slice(separator + 1);
			if (value) this.values.set(key, value);
			else this.values.delete(key);
		}
		return response;
	}
}
function domainRequest(
	jar: CookieJar,
	path: string,
	method: "GET" | "POST" | "PUT",
	body?: unknown,
	extra: Record<string, string> = {},
) {
	return sessionApp.request(path, {
		method,
		headers: {
			Cookie: jar.header,
			"Content-Type": "application/json",
			...extra,
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
}

async function expectUnauthenticated(response: Response) {
	expect(response.status).toBe(401);
	expect(await response.json()).toMatchObject({
		error: { code: "UNAUTHENTICATED" },
	});
}

const resourceId = crypto.randomUUID();
const protectedRoutes = [
	["GET", "/auth/me"],
	["GET", "/profile"],
	["PUT", "/profile"],
	["GET", "/household"],
	["PUT", "/household"],
	["GET", "/kitchen"],
	["PUT", "/kitchen"],
	["GET", "/inventory"],
	["POST", "/inventory/items"],
	["PUT", `/inventory/items/${resourceId}`],
	["DELETE", `/inventory/items/${resourceId}`],
	["GET", "/favorites"],
	["POST", "/favorites"],
	["DELETE", `/favorites/${resourceId}`],
	["POST", "/cooking/recommendations"],
	["POST", "/cooking/pre-cooking"],
	["POST", "/cooking-sessions"],
	["GET", `/cooking-sessions/${resourceId}`],
	["PATCH", `/cooking-sessions/${resourceId}/progress`],
	["POST", `/cooking-sessions/${resourceId}/complete`],
	["GET", `/cooking-sessions/${resourceId}/nutrition`],
	["POST", `/cooking-sessions/${resourceId}/active-cooking`],
	["POST", `/cooking-sessions/${resourceId}/completion`],
] as const;

async function expectProtectedRoutesRejected(headers: Record<string, string>) {
	for (const [method, path] of protectedRoutes) {
		await expectUnauthenticated(
			await sessionApp.request(path, { method, headers }),
		);
	}
}

afterAll(async () => {
	await db.delete(users).where(eq(users.email, otherAddress));
	await db.delete(users).where(eq(users.email, address));
	await client.end();
});

test("only live Better Auth sessions authenticate protected routes and select domain ownership", async () => {
	const jar = new CookieJar();
	await expectProtectedRoutesRejected({});
	const openapi = (await (
		await sessionApp.request("/openapi.json")
	).json()) as {
		components: {
			securitySchemes: Record<string, Record<string, unknown>>;
		};
		paths: Record<string, Record<string, { security?: unknown }>>;
	};
	expect(openapi.components.securitySchemes.CurrentUser).toMatchObject({
		type: "apiKey",
		in: "cookie",
		name: "better-auth.session_token",
	});
	expect(openapi.components.securitySchemes.DevelopmentUser).toBeUndefined();
	expect(openapi.paths["/auth/me"]?.get?.security).toEqual([
		{ CurrentUser: [] },
	]);
	expect(openapi.paths["/profile"]?.get?.security).toEqual([
		{ CurrentUser: [] },
	]);

	expect(
		(
			await jar.request("/auth/sign-up/email", {
				name: "A5 User",
				email: address,
				password: "abcdefgh",
			})
		).status,
	).toBe(200);
	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, address));
	if (!user) throw new Error("A5 user missing");
	await expectProtectedRoutesRejected({ "x-flemme-user-id": user.id });
	expect(await (await jar.request("/auth/me")).json()).toEqual({
		user: { id: user.id, email: address },
	});
	for (const path of [
		"/profile",
		"/household",
		"/kitchen",
		"/inventory",
		"/favorites",
	]) {
		expect((await jar.request(path)).status).not.toBe(401);
	}

	const otherJar = new CookieJar();
	expect(
		(
			await otherJar.request("/auth/sign-up/email", {
				name: "A5 Other User",
				email: otherAddress,
				password: "abcdefgh",
			})
		).status,
	).toBe(200);
	const [otherUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, otherAddress));
	if (!otherUser) throw new Error("A5 other user missing");
	expect(
		await (
			await jar.request("/auth/me", undefined, {
				"x-flemme-user-id": otherUser.id,
			})
		).json(),
	).toEqual({ user: { id: user.id, email: address } });
	expect(
		(
			await domainRequest(
				jar,
				"/profile",
				"PUT",
				{
					foodPreferences: ["savory"],
					cookingPreferences: ["simple meals"],
				},
				{ "x-flemme-user-id": otherUser.id },
			)
		).status,
	).toBe(200);
	expect((await otherJar.request("/profile")).status).toBe(404);
	expect(
		(
			await domainRequest(jar, "/household", "PUT", {
				adults: 2,
				children: 1,
				toddlers: 0,
			})
		).status,
	).toBe(200);
	expect(
		(
			await domainRequest(jar, "/kitchen", "PUT", {
				equipment: ["wok"],
			})
		).status,
	).toBe(200);
	const inventoryResponse = await domainRequest(
		jar,
		"/inventory/items",
		"POST",
		{
			ingredientKey: "egg",
			quantity: 2,
			unit: "pcs",
			isApproximate: false,
			condition: "fresh",
		},
	);
	expect(inventoryResponse.status).toBe(201);
	const inventoryItem = (await inventoryResponse.json()) as { id: string };
	expect(
		(
			await domainRequest(
				otherJar,
				`/inventory/items/${inventoryItem.id}`,
				"PUT",
				{
					quantity: null,
					unit: null,
					isApproximate: false,
					condition: "unknown",
				},
			)
		).status,
	).toBe(403);

	expect(
		(
			await domainRequest(jar, "/cooking/recommendations", "POST", {
				session: { request: "Use my saved context.", servings: 2 },
			})
		).status,
	).toBe(200);
	expect(capturedRecommendationContext).toEqual({
		inventory: [{ name: "egg", quantity: "2 pcs", condition: "fresh" }],
		kitchen: { equipment: ["wok"] },
		household: { adults: 2, children: 1, toddlers: 0 },
		foodPreferences: ["savory"],
		cookingPreferences: ["simple meals"],
		session: { request: "Use my saved context.", servings: 2 },
	});
	expect(
		(
			await domainRequest(jar, "/cooking/recommendations", "POST", {
				inventory: [],
				kitchen: { equipment: [] },
				household: { adults: 1, children: 0, toddlers: 0 },
				foodPreferences: [],
				cookingPreferences: [],
				session: { request: "Use overrides.", servings: 1 },
			})
		).status,
	).toBe(200);
	expect(capturedRecommendationContext).toEqual({
		inventory: [],
		kitchen: { equipment: [] },
		household: { adults: 1, children: 0, toddlers: 0 },
		foodPreferences: [],
		cookingPreferences: [],
		session: { request: "Use overrides.", servings: 1 },
	});

	const cookingSessionResponse = await domainRequest(
		jar,
		"/cooking-sessions",
		"POST",
		cookingSessionRequest,
	);
	expect(cookingSessionResponse.status).toBe(201);
	const cookingSession = (await cookingSessionResponse.json()) as {
		id: string;
	};
	expect(
		(await domainRequest(jar, `/cooking-sessions/${cookingSession.id}`, "GET"))
			.status,
	).toBe(200);
	expect(
		(
			await domainRequest(
				otherJar,
				`/cooking-sessions/${cookingSession.id}`,
				"GET",
				undefined,
				{ "x-flemme-user-id": user.id },
			)
		).status,
	).toBe(403);
	expect(
		(
			await domainRequest(
				jar,
				`/cooking-sessions/${cookingSession.id}/nutrition`,
				"GET",
			)
		).status,
	).not.toBe(401);
	expect(
		(
			await domainRequest(jar, "/cooking/pre-cooking", "POST", {
				selectedRecipe,
				session: { request: "Prepare this.", servings: 2 },
			})
		).status,
	).toBe(503);
	const sessionCookieName = jar.values.keys().next().value;
	if (!sessionCookieName) throw new Error("A5 session cookie missing");
	await expectProtectedRoutesRejected({
		Cookie: `${sessionCookieName}=invalid`,
	});
	await expectProtectedRoutesRejected({
		Cookie: `${sessionCookieName}=invalid`,
		"x-flemme-user-id": user.id,
	});

	const authenticated = await jar.request("/profile");
	expect(authenticated.status).toBe(200);
	expect(await authenticated.json()).toEqual({
		foodPreferences: ["savory"],
		cookingPreferences: ["simple meals"],
	});

	const [persistedSession] = await db
		.select()
		.from(authSessions)
		.where(eq(authSessions.userId, user.id));
	if (!persistedSession) throw new Error("A5 persisted session missing");

	await db
		.update(authSessions)
		.set({ expiresAt: new Date(Date.now() - 1_000) })
		.where(eq(authSessions.userId, user.id));
	await expectProtectedRoutesRejected({
		Cookie: jar.header,
		"x-flemme-user-id": user.id,
	});

	await db
		.insert(authSessions)
		.values({
			...persistedSession,
			expiresAt: new Date(Date.now() + 86_400_000),
		})
		.onConflictDoUpdate({
			target: authSessions.id,
			set: { expiresAt: new Date(Date.now() + 86_400_000) },
		});
	expect((await jar.request("/profile")).status).toBe(200);
	const oldCookie = jar.header;
	expect((await jar.request("/auth/sign-out", {})).status).toBe(200);
	await expectProtectedRoutesRejected({ Cookie: oldCookie });
	await expectProtectedRoutesRejected({
		Cookie: oldCookie,
		"x-flemme-user-id": user.id,
	});
	await expectUnauthenticated(await jar.request("/auth/me"));
});
