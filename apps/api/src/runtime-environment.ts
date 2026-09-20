import { z } from "zod";

const RuntimeEnvironmentSchema = z.object({
	API_HOST: z.enum(["127.0.0.1", "0.0.0.0"]).default("127.0.0.1"),
	PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export function readRuntimeEnvironment(
	input: Record<string, string | undefined>,
) {
	const result = RuntimeEnvironmentSchema.safeParse(input);
	if (!result.success) {
		throw new Error(
			`Invalid API runtime configuration: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
		);
	}
	return result.data;
}
