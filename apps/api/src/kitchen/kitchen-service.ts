import { type FlemmeDatabase, kitchenEquipment, kitchens } from "@flemme/db";
import { eq } from "drizzle-orm";

import { ApiError } from "../api-error";
import {
	type KitchenResponse,
	KitchenResponseSchema,
	type PutKitchenRequest,
} from "./kitchen-schema";

function restoreKitchen(equipment: string[]): KitchenResponse {
	try {
		return KitchenResponseSchema.parse({
			equipment: [...equipment].sort((left, right) => {
				const normalizedLeft = left.toLowerCase();
				const normalizedRight = right.toLowerCase();

				if (normalizedLeft < normalizedRight) return -1;
				if (normalizedLeft > normalizedRight) return 1;
				if (left < right) return -1;
				if (left > right) return 1;
				return 0;
			}),
		});
	} catch {
		throw new ApiError(
			500,
			"INVALID_PERSISTED_KITCHEN",
			"Kitchen contains invalid persisted data",
		);
	}
}

export function createKitchenService(db: FlemmeDatabase) {
	return {
		async get(userId: string): Promise<KitchenResponse> {
			const [kitchen] = await db
				.select({ id: kitchens.id })
				.from(kitchens)
				.where(eq(kitchens.userId, userId));

			if (!kitchen) {
				throw new ApiError(404, "KITCHEN_NOT_FOUND", "Kitchen not found");
			}

			const equipment = await db
				.select({ name: kitchenEquipment.name })
				.from(kitchenEquipment)
				.where(eq(kitchenEquipment.kitchenId, kitchen.id));

			return restoreKitchen(equipment.map(({ name }) => name));
		},

		async put(
			userId: string,
			input: PutKitchenRequest,
		): Promise<KitchenResponse> {
			return db.transaction(async (transaction) => {
				const [kitchen] = await transaction
					.insert(kitchens)
					.values({ userId })
					.onConflictDoUpdate({
						target: kitchens.userId,
						set: { updatedAt: new Date() },
					})
					.returning({ id: kitchens.id });

				if (!kitchen) {
					throw new ApiError(
						500,
						"KITCHEN_SAVE_FAILED",
						"Kitchen could not be saved",
					);
				}

				await transaction
					.delete(kitchenEquipment)
					.where(eq(kitchenEquipment.kitchenId, kitchen.id));

				if (input.equipment.length > 0) {
					await transaction.insert(kitchenEquipment).values(
						input.equipment.map((name) => ({
							kitchenId: kitchen.id,
							name,
						})),
					);
				}

				return restoreKitchen(input.equipment);
			});
		},
	};
}
