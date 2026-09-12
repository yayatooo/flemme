import { type FlemmeDatabase, users } from "@flemme/db";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { ApiEnvironment } from "../api-environment";
import { ApiError } from "../api-error";

const UserIdSchema = z.string().uuid();

export function createDevelopmentAuthMiddleware(db: FlemmeDatabase) {
	return createMiddleware<ApiEnvironment>(async (context, next) => {
		const userId = UserIdSchema.safeParse(
			context.req.header("x-flemme-user-id"),
		);

		if (!userId.success) {
			throw new ApiError(
				401,
				"UNAUTHENTICATED",
				"A valid development user ID is required",
			);
		}

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, userId.data));

		if (!user) {
			throw new ApiError(
				401,
				"UNAUTHENTICATED",
				"The development user does not exist",
			);
		}

		context.set("currentUserId", user.id);
		await next();
	});
}
