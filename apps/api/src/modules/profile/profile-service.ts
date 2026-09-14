import { type FlemmeDatabase, userProfiles } from "@flemme/db";
import { eq } from "drizzle-orm";

import { ApiError } from "../../api-error";
import type { ProfileResponse, PutProfileRequest } from "./profile-schema";
import { ProfileResponseSchema } from "./profile-schema";

function restoreProfile(
	row: Pick<
		typeof userProfiles.$inferSelect,
		"foodPreferences" | "cookingPreferences"
	>,
): ProfileResponse {
	try {
		return ProfileResponseSchema.parse(row);
	} catch {
		throw new ApiError(
			500,
			"INVALID_PERSISTED_PROFILE",
			"Profile contains invalid persisted data",
		);
	}
}

export function createProfileService(db: FlemmeDatabase) {
	return {
		async get(userId: string): Promise<ProfileResponse> {
			const [profile] = await db
				.select({
					foodPreferences: userProfiles.foodPreferences,
					cookingPreferences: userProfiles.cookingPreferences,
				})
				.from(userProfiles)
				.where(eq(userProfiles.userId, userId));

			if (!profile) {
				throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
			}

			return restoreProfile(profile);
		},

		async put(
			userId: string,
			input: PutProfileRequest,
		): Promise<ProfileResponse> {
			const [profile] = await db
				.insert(userProfiles)
				.values({
					userId,
					foodPreferences: input.foodPreferences,
					cookingPreferences: input.cookingPreferences,
				})
				.onConflictDoUpdate({
					target: userProfiles.userId,
					set: {
						foodPreferences: input.foodPreferences,
						cookingPreferences: input.cookingPreferences,
						updatedAt: new Date(),
					},
				})
				.returning({
					foodPreferences: userProfiles.foodPreferences,
					cookingPreferences: userProfiles.cookingPreferences,
				});

			if (!profile) {
				throw new ApiError(
					500,
					"PROFILE_SAVE_FAILED",
					"Profile could not be saved",
				);
			}

			return restoreProfile(profile);
		},
	};
}
