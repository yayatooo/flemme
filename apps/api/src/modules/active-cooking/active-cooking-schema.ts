import { ActiveCookingOutputSchema } from "@flemme/agent";
import { z } from "@hono/zod-openapi";

const MAX_ACTIVE_COOKING_MESSAGE_LENGTH = 2_000;

export const ActiveCookingRequestSchema = z
	.object({
		message: z
			.string()
			.trim()
			.min(1)
			.max(MAX_ACTIVE_COOKING_MESSAGE_LENGTH)
			.openapi({
				description: "Latest user message about the current cooking session",
				example: "Bawangnya mulai gosong, harus bagaimana?",
			}),
	})
	.strict();

export type ActiveCookingRequest = z.infer<typeof ActiveCookingRequestSchema>;

export const ActiveCookingResponseSchema = ActiveCookingOutputSchema;

export type ActiveCookingResponse = z.infer<typeof ActiveCookingResponseSchema>;
