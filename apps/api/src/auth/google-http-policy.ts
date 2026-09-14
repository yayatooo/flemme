import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { z } from "zod";

// Native social sign-in accepts extra scopes/authorization parameters. Flemme
// only authorizes identity access; clients cannot opt into Google API access.
const identityOptions = z.object({
	scopes: z.array(z.enum(["openid", "email", "profile"])).optional(),
	additionalParams: z.object({}).strict().optional(),
});
export const googleHttpPolicy = {
	id: "flemme-google-http-policy",
	hooks: {
		before: [
			{
				matcher: (ctx) =>
					ctx.path === "/sign-in/social" && ctx.body?.provider === "google",
				handler: createAuthMiddleware(async (ctx) => {
					if (!identityOptions.safeParse(ctx.body).success) {
						throw new APIError("BAD_REQUEST", {
							code: "GOOGLE_IDENTITY_SCOPES_ONLY",
							message:
								"Only Google identity scopes are supported; extra authorization parameters are not allowed",
						});
					}
				}),
			},
		],
	},
} satisfies BetterAuthPlugin;
