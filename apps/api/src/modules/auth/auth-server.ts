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

function isAuthEnvironment(
	input: AuthEnvironment | Record<string, string | undefined>,
): input is AuthEnvironment {
	return typeof input.GOOGLE_AUTH_ENABLED === "boolean";
}

function createGoogleProvider(env: AuthEnvironment) {
	if (!env.GOOGLE_AUTH_ENABLED) return {};
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error(
			"Invalid Auth configuration: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required",
		);
	}
	return {
		google: {
			clientId,
			clientSecret,
			accessType: "online" as const,
			includeGrantedScopes: false,
			disableDefaultScope: true,
			scope: ["openid", "email", "profile"],
			disableIdTokenSignIn: true,
		},
	};
}

export function createAuthServer(
	db: FlemmeDatabase,
	input: AuthEnvironment | Record<string, string | undefined>,
) {
	const env = isAuthEnvironment(input) ? input : readAuthEnvironment(input);
	return betterAuth({
		...authSchemaOptions,
		baseURL: env.BETTER_AUTH_URL,
		basePath: "/api/auth",
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.WEB_ORIGIN],
		socialProviders: createGoogleProvider(env),
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
		plugins: [
			passwordHttpPolicy,
			...(env.GOOGLE_AUTH_ENABLED ? [googleHttpPolicy] : []),
		],
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
