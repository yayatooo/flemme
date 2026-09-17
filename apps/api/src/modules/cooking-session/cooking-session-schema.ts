import {
	ActiveCookingSessionSchema,
	CompletionOutputSchema,
} from "@flemme/agent";
import {
	COOKING_HISTORY_MAX_PAGE_SIZE,
	COOKING_HISTORY_PAGE_SIZE,
	type CookingHistoryPage,
	CookingHistoryPageSchema,
} from "@flemme/contracts/cooking-history";
import {
	type CookingSessionResponse,
	CookingSessionResponseSchema,
	type CreateCookingSessionRequest,
	CreateCookingSessionRequestSchema,
	type ResumableCookingSessionResponse,
	ResumableCookingSessionResponseSchema,
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

export const CookingHistoryQuerySchema = z.object({
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(COOKING_HISTORY_MAX_PAGE_SIZE)
		.default(COOKING_HISTORY_PAGE_SIZE),
	offset: z.coerce.number().int().nonnegative().default(0),
});

export type CookingHistoryQuery = z.infer<typeof CookingHistoryQuerySchema>;

export type {
	CookingHistoryPage,
	CookingSessionResponse,
	CreateCookingSessionRequest,
	ResumableCookingSessionResponse,
	UpdateCookingSessionRequest,
};
export {
	CookingHistoryPageSchema,
	CookingSessionResponseSchema,
	CreateCookingSessionRequestSchema,
	ResumableCookingSessionResponseSchema,
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
