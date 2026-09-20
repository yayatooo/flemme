import { z } from "zod";

const origin = z.url().refine((value) => {
	if (!URL.canParse(value)) return false;
	const url = new URL(value);
	return ["http:", "https:"].includes(url.protocol) && url.origin === value;
}, "Must be an exact HTTP(S) origin without path, credentials or trailing slash");
const optionalCredential = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z.string().trim().min(1).optional(),
);
const AuthEnvironmentSchema = z
	.object({
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: origin,
		WEB_ORIGIN: origin,
		GOOGLE_AUTH_ENABLED: z.enum(["true", "false"]).default("false"),
		GOOGLE_CLIENT_ID: optionalCredential,
		GOOGLE_CLIENT_SECRET: optionalCredential,
		NODE_ENV: z.string().optional(),
	})
	.superRefine((env, ctx) => {
		if (
			env.NODE_ENV === "production" &&
			(!env.BETTER_AUTH_URL.startsWith("https://") ||
				!env.WEB_ORIGIN.startsWith("https://"))
		) {
			ctx.addIssue({
				code: "custom",
				message: "Production auth origins must use HTTPS",
			});
		}
		const hasClientId = env.GOOGLE_CLIENT_ID !== undefined;
		const hasClientSecret = env.GOOGLE_CLIENT_SECRET !== undefined;
		if (hasClientId !== hasClientSecret) {
			ctx.addIssue({
				code: "custom",
				path: [hasClientId ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID"],
				message: "is required when the other Google credential is configured",
			});
		}
		if (env.GOOGLE_AUTH_ENABLED === "true") {
			for (const name of [
				"GOOGLE_CLIENT_ID",
				"GOOGLE_CLIENT_SECRET",
			] as const) {
				if (!env[name]) {
					ctx.addIssue({
						code: "custom",
						path: [name],
						message: "is required when GOOGLE_AUTH_ENABLED=true",
					});
				}
			}
		}
	});
export function readAuthEnvironment(input: Record<string, string | undefined>) {
	const result = AuthEnvironmentSchema.safeParse(input);
	if (!result.success) {
		throw new Error(
			`Invalid Auth configuration: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
		);
	}
	return {
		...result.data,
		GOOGLE_AUTH_ENABLED: result.data.GOOGLE_AUTH_ENABLED === "true",
	};
}
export type AuthEnvironment = ReturnType<typeof readAuthEnvironment>;
