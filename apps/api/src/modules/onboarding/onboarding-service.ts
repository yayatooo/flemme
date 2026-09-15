import {
	type FlemmeDatabase,
	households,
	inventories,
	kitchens,
	userProfiles,
	users,
} from "@flemme/db";
import { and, eq, isNull } from "drizzle-orm";

import { ApiError } from "../../api-error";
import type { OnboardingStatusResponse } from "./onboarding-schema";

export function createOnboardingService(db: FlemmeDatabase) {
	async function get(userId: string): Promise<OnboardingStatusResponse> {
		const [state] = await db
			.select({
				completedAt: users.onboardingCompletedAt,
				profileUserId: userProfiles.userId,
				householdUserId: households.userId,
				kitchenUserId: kitchens.userId,
				inventoryUserId: inventories.userId,
			})
			.from(users)
			.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
			.leftJoin(households, eq(households.userId, users.id))
			.leftJoin(kitchens, eq(kitchens.userId, users.id))
			.leftJoin(inventories, eq(inventories.userId, users.id))
			.where(eq(users.id, userId));

		if (!state) {
			throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
		}

		const nextStep = state.completedAt
			? null
			: !state.profileUserId
				? "profile"
				: !state.householdUserId
					? "household"
					: !state.kitchenUserId
						? "kitchen"
						: !state.inventoryUserId
							? "inventory"
							: "complete";

		return {
			completed: state.completedAt !== null,
			completedAt: state.completedAt?.toISOString() ?? null,
			nextStep,
		};
	}

	return {
		get,
		async complete(userId: string): Promise<OnboardingStatusResponse> {
			const status = await get(userId);
			if (status.completed) return status;
			if (status.nextStep !== "complete") {
				throw new ApiError(
					409,
					"ONBOARDING_INCOMPLETE",
					"Required onboarding steps are incomplete",
				);
			}

			await db
				.update(users)
				.set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
				.where(and(eq(users.id, userId), isNull(users.onboardingCompletedAt)));
			return get(userId);
		},
	};
}
