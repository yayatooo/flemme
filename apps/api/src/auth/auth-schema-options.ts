import type { BetterAuthOptions } from "better-auth";

// Shared schema/policy baseline. Product sign-in stays disabled until A3/A4.
export const authSchemaOptions = {
	advanced: { database: { generateId: "uuid" } },
	user: { modelName: "users" },
	account: {
		modelName: "authAccounts",
		accountLinking: { disableImplicitLinking: true },
	},
	session: { modelName: "authSessions", cookieCache: { enabled: false } },
	verification: { modelName: "authVerifications" },
	emailAndPassword: {
		enabled: false,
		password: {
			hash: (password: string) =>
				Bun.password.hash(password, { algorithm: "argon2id" }),
			verify: ({ password, hash }: { password: string; hash: string }) =>
				Bun.password.verify(password, hash),
		},
	},
} satisfies BetterAuthOptions;
