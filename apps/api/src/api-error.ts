import { z } from "@hono/zod-openapi";

export type ApiErrorStatus =
	| 400
	| 401
	| 403
	| 404
	| 409
	| 422
	| 500
	| 502
	| 503;

export const ApiErrorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
	}),
});

export class ApiError extends Error {
	readonly code: string;
	readonly status: ApiErrorStatus;

	constructor(status: ApiErrorStatus, code: string, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

export function createApiErrorPayload(error: ApiError) {
	return {
		error: {
			code: error.code,
			message: error.message,
		},
	};
}
