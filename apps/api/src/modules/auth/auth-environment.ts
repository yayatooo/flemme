import { z } from "zod";

const origin = z.url().refine((value) => {
	if (!URL.canParse(value)) return false;
	const url = new URL(value);
	return ["http:", "https:"].includes(url.protocol) && url.origin === value;
}, "Must be an exact HTTP(S) origin without path, credentials or trailing slash");
const AuthEnvironmentSchema = z
	.object({
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: origin,
		WEB_ORIGIN: origin,
		GOOGLE_CLIENT_ID: z.string().trim().min(1),
		GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
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
	});
export function readAuthEnvironment(input: Record<string, string | undefined>) {
	const result = AuthEnvironmentSchema.safeParse(input);
	if (!result.success) {
		throw new Error(
			`Invalid Auth configuration: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
		);
	}
	return result.data;
}
export type AuthEnvironment = ReturnType<typeof readAuthEnvironment>;
