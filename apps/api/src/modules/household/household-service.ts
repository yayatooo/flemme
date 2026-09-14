import { type FlemmeDatabase, households } from "@flemme/db";
import { eq } from "drizzle-orm";

import { ApiError } from "../../api-error";
import {
	type HouseholdResponse,
	HouseholdResponseSchema,
	type PutHouseholdRequest,
} from "./household-schema";

function restoreHousehold(
	row: Pick<typeof households.$inferSelect, "adults" | "children" | "toddlers">,
): HouseholdResponse {
	try {
		return HouseholdResponseSchema.parse(row);
	} catch {
		throw new ApiError(
			500,
			"INVALID_PERSISTED_HOUSEHOLD",
			"Household contains invalid persisted data",
		);
	}
}

export function createHouseholdService(db: FlemmeDatabase) {
	return {
		async get(userId: string): Promise<HouseholdResponse> {
			const [household] = await db
				.select({
					adults: households.adults,
					children: households.children,
					toddlers: households.toddlers,
				})
				.from(households)
				.where(eq(households.userId, userId));

			if (!household) {
				throw new ApiError(404, "HOUSEHOLD_NOT_FOUND", "Household not found");
			}

			return restoreHousehold(household);
		},

		async put(
			userId: string,
			input: PutHouseholdRequest,
		): Promise<HouseholdResponse> {
			const [household] = await db
				.insert(households)
				.values({ userId, ...input })
				.onConflictDoUpdate({
					target: households.userId,
					set: { ...input, updatedAt: new Date() },
				})
				.returning({
					adults: households.adults,
					children: households.children,
					toddlers: households.toddlers,
				});

			if (!household) {
				throw new ApiError(
					500,
					"HOUSEHOLD_SAVE_FAILED",
					"Household could not be saved",
				);
			}

			return restoreHousehold(household);
		},
	};
}
