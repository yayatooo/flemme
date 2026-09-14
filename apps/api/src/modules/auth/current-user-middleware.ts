import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { ApiEnvironment } from "../../api-environment";
import { ApiError } from "../../api-error";
import type { AuthServer } from "./auth-server";

const UserIdSchema = z.string().uuid();

export function createCurrentUserMiddleware(auth: AuthServer) {
	return createMiddleware<ApiEnvironment>(async (context, next) => {
		const session = await auth.api.getSession({
			headers: context.req.raw.headers,
		});
		const userId = UserIdSchema.safeParse(session?.user.id);

		if (!userId.success) {
			throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
		}

		context.set("currentUserId", userId.data);
		await next();
	});
}
