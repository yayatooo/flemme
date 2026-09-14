import { type FlemmeDatabase, users } from "@flemme/db";
import { eq } from "drizzle-orm";
import { ApiError } from "../api-error";

export function createCurrentUserService(db: FlemmeDatabase) {
	return {
		async get(currentUserId: string) {
			const [user] = await db
				.select({ id: users.id, email: users.email })
				.from(users)
				.where(eq(users.id, currentUserId));

			if (!user) {
				throw new ApiError(
					401,
					"UNAUTHENTICATED",
					"Authentication is required",
				);
			}

			return { user };
		},
	};
}
