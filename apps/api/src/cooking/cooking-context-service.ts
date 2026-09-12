import {
	type CookingRecommendationInput,
	CookingRecommendationInputSchema,
} from "@flemme/agent";
import {
	type FlemmeDatabase,
	households,
	inventories,
	inventoryItems,
	kitchenEquipment,
	kitchens,
	userProfiles,
} from "@flemme/db";
import { IngredientKeySchema } from "@flemme/ingredients";
import { eq } from "drizzle-orm";

import { ApiError } from "../api-error";
import type { CookingRecommendationRequest } from "../cooking-recommendation/cooking-recommendation-schema";

function formatInventoryQuantity(item: {
	quantity: number | null;
	unit: string | null;
	isApproximate: boolean;
}) {
	if (item.quantity === null || item.unit === null) {
		return undefined;
	}

	return `${item.isApproximate ? "approximately " : ""}${item.quantity} ${item.unit}`;
}

function validatePersistedIngredientKey(ingredientKey: string) {
	const result = IngredientKeySchema.safeParse(ingredientKey);

	if (!result.success) {
		throw new ApiError(
			500,
			"INVALID_PERSISTED_INGREDIENT_KEY",
			"Persistent inventory contains an invalid canonical ingredient key",
		);
	}

	return result.data;
}

export function createCookingContextService(db: FlemmeDatabase) {
	return {
		async build(
			userId: string,
			overrides: CookingRecommendationRequest,
		): Promise<CookingRecommendationInput> {
			const [[profile], [household], [kitchen], [inventory]] =
				await Promise.all([
					db.select().from(userProfiles).where(eq(userProfiles.userId, userId)),
					db.select().from(households).where(eq(households.userId, userId)),
					db.select().from(kitchens).where(eq(kitchens.userId, userId)),
					db.select().from(inventories).where(eq(inventories.userId, userId)),
				]);

			if (!household && !overrides.household) {
				throw new ApiError(
					422,
					"MISSING_HOUSEHOLD_CONTEXT",
					"Household context is required for recommendations",
				);
			}

			if (!kitchen && !overrides.kitchen) {
				throw new ApiError(
					422,
					"MISSING_KITCHEN_CONTEXT",
					"Kitchen context is required for recommendations",
				);
			}

			if (!inventory && !overrides.inventory) {
				throw new ApiError(
					422,
					"MISSING_INVENTORY_CONTEXT",
					"Inventory context is required for recommendations",
				);
			}

			const [equipment, items] = await Promise.all([
				kitchen
					? db
							.select({ name: kitchenEquipment.name })
							.from(kitchenEquipment)
							.where(eq(kitchenEquipment.kitchenId, kitchen.id))
					: Promise.resolve([]),
				inventory
					? db
							.select({
								ingredientKey: inventoryItems.ingredientKey,
								quantity: inventoryItems.quantity,
								unit: inventoryItems.unit,
								isApproximate: inventoryItems.isApproximate,
								condition: inventoryItems.condition,
							})
							.from(inventoryItems)
							.where(eq(inventoryItems.inventoryId, inventory.id))
					: Promise.resolve([]),
			]);

			return CookingRecommendationInputSchema.parse({
				inventory:
					overrides.inventory ??
					items.map((item) => ({
						name: validatePersistedIngredientKey(item.ingredientKey),
						quantity: formatInventoryQuantity(item),
						condition: item.condition,
					})),
				kitchen:
					overrides.kitchen ??
					(kitchen
						? { equipment: equipment.map(({ name }) => name) }
						: undefined),
				household:
					overrides.household ??
					(household
						? {
								adults: household.adults,
								children: household.children,
								toddlers: household.toddlers,
							}
						: undefined),
				foodPreferences:
					overrides.foodPreferences ?? profile?.foodPreferences ?? [],
				cookingPreferences:
					overrides.cookingPreferences ?? profile?.cookingPreferences ?? [],
				session: overrides.session,
			});
		},
	};
}
