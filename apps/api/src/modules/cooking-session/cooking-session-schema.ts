import {
	ActiveCookingSessionSchema,
	CompletionOutputSchema,
} from "@flemme/agent";
import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
	CreateCookingSessionRequestSchema,
	CookingSessionIdSchema as SharedCookingSessionIdSchema,
	type UpdateCookingSessionRequest,
	UpdateCookingSessionRequestSchema,
} from "@flemme/contracts/cooking-session";
import { z } from "@hono/zod-openapi";

export const CookingSessionIdSchema = SharedCookingSessionIdSchema;
export const CookingSessionParamsSchema = z.object({
	id: z
		.string()
		.pipe(CookingSessionIdSchema)
		.openapi({
			param: {
				name: "id",
				in: "path",
			},
			description: "Cooking session UUID",
		}),
});

export type {
	CookingSessionResponse,
	CreateCookingSessionRequest,
	UpdateCookingSessionRequest,
};
export {
	CookingSessionResponseSchema,
	CreateCookingSessionRequestSchema,
	UpdateCookingSessionRequestSchema,
};
export const UpdateCookingProgressRequestSchema = z.object({
	session: ActiveCookingSessionSchema,
});

export type UpdateCookingProgressRequest = z.infer<
	typeof UpdateCookingProgressRequestSchema
>;

export const CompleteCookingSessionRequestSchema = z
	.object({
		completionSnapshot: CompletionOutputSchema,
	})
	.strict();

export type CompleteCookingSessionRequest = z.infer<
	typeof CompleteCookingSessionRequestSchema
>;
