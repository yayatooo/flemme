import {
	authAccounts,
	authSessions,
	authVerifications,
	type FlemmeDatabase,
	users,
} from "@flemme/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type AuthEnvironment, readAuthEnvironment } from "./auth-environment";
import { authSchemaOptions } from "./auth-schema-options";
import { googleHttpPolicy } from "./google-http-policy";
import { passwordHttpPolicy } from "./password-http-policy";

export function createAuthServer(db: FlemmeDatabase, input: AuthEnvironment) {
	const env = readAuthEnvironment(input);
	return betterAuth({
		...authSchemaOptions,
		baseURL: env.BETTER_AUTH_URL,
		basePath: "/auth",
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.WEB_ORIGIN],
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
				accessType: "online",
				includeGrantedScopes: false,
				disableDefaultScope: true,
				scope: ["openid", "email", "profile"],
				disableIdTokenSignIn: true,
			},
		},
		// Provider tokens and provider management are not public Flemme features.
		disabledPaths: [
			"/get-access-token",
			"/refresh-token",
			"/link-social",
			"/unlink-account",
		],
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: { users, authAccounts, authSessions, authVerifications },
		}),
		advanced: {
			...authSchemaOptions.advanced,
			disableCSRFCheck: false,
			disableOriginCheck: false,
			useSecureCookies:
				env.NODE_ENV === "production" ||
				env.BETTER_AUTH_URL.startsWith("https://"),
			defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
			crossSubDomainCookies: { enabled: false },
		},
		session: {
			...authSchemaOptions.session,
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		account: {
			...authSchemaOptions.account,
			accountLinking: { enabled: false, disableImplicitLinking: true },
		},
		emailAndPassword: {
			...authSchemaOptions.emailAndPassword,
			enabled: true,
			disableSignUp: false,
			requireEmailVerification: false,
			autoSignIn: true,
			minPasswordLength: 8,
			maxPasswordLength: 128,
		},
		plugins: [passwordHttpPolicy, googleHttpPolicy],
		rateLimit: {
			enabled: true,
			storage: "memory",
			window: 60,
			max: 100,
			customRules: {
				"/sign-up/email": { window: 60, max: 20 },
				"/sign-in/email": { window: 60, max: 20 },
				"/sign-in/social": { window: 60, max: 20 },
			},
		},
		// No business hooks, recovery email or secondary storage.
	});
}
export type AuthServer = ReturnType<typeof createAuthServer>;
