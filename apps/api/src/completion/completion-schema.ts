import { CompletionOutputSchema } from "@flemme/agent";
import { z } from "@hono/zod-openapi";

const MAX_COMPLETION_MESSAGE_LENGTH = 2_000;

export const CompletionRequestSchema = z
	.object({
		message: z
			.string()
			.trim()
			.min(1)
			.max(MAX_COMPLETION_MESSAGE_LENGTH)
			.openapi({
				description: "Optional final user message about the completed cooking",
				example: "Masakannya sudah selesai.",
			})
			.optional(),
	})
	.strict();

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;

export const CompletionResponseSchema = CompletionOutputSchema;

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;
