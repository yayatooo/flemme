import { type FlemmeDatabase, inventories, inventoryItems } from "@flemme/db";
import {
	normalizeIngredientName,
	productionIngredientCatalog,
} from "@flemme/ingredients";
import { and, eq, inArray, ne } from "drizzle-orm";
import { ApiError } from "../../api-error";
import {
	type CreateInventoryItem,
	InventoryItemResponseSchema,
	type ReplaceInventoryItems,
	type UpdateInventoryItem,
} from "./inventory-schema";

function restore(row: typeof inventoryItems.$inferSelect) {
	const result = InventoryItemResponseSchema.safeParse({
		id: row.id,
		ingredientKey: row.ingredientKey,
		name: row.name,
		quantity: row.quantity,
		unit: row.unit,
		isApproximate: row.isApproximate,
		condition: row.condition,
	});
	if (!result.success)
		throw new ApiError(
			500,
			"INVALID_PERSISTED_INVENTORY",
			"Inventory contains invalid persisted data",
		);
	return result.data;
}

function resolveIdentity(name: string) {
	const ingredient = productionIngredientCatalog.resolveName(name);
	return {
		identityKey: ingredient?.key ?? normalizeIngredientName(name),
		ingredientKey: ingredient?.key ?? null,
		name,
	};
}

function isUniqueViolation(error: unknown) {
	if (!error || typeof error !== "object") return false;
	if ("code" in error && error.code === "23505") return true;
	if (!("cause" in error)) return false;
	const { cause } = error;
	return (
		!!cause &&
		typeof cause === "object" &&
		"code" in cause &&
		cause.code === "23505"
	);
}
export function createInventoryService(db: FlemmeDatabase) {
	const ownedInventories = (userId: string) =>
		db
			.select({ id: inventories.id })
			.from(inventories)
			.where(eq(inventories.userId, userId));
	async function assertOwned(userId: string, id: string) {
		const [row] = await db
			.select({
				userId: inventories.userId,
				inventoryId: inventoryItems.inventoryId,
			})
			.from(inventoryItems)
			.innerJoin(inventories, eq(inventoryItems.inventoryId, inventories.id))
			.where(eq(inventoryItems.id, id));
		if (!row)
			throw new ApiError(
				404,
				"INVENTORY_ITEM_NOT_FOUND",
				"Inventory item not found",
			);
		if (row.userId !== userId)
			throw new ApiError(
				403,
				"INVENTORY_ITEM_FORBIDDEN",
				"Inventory item belongs to another user",
			);
		return row;
	}
	return {
		async get(userId: string) {
			const [inventory] = await ownedInventories(userId);
			if (!inventory)
				throw new ApiError(404, "INVENTORY_NOT_FOUND", "Inventory not found");
			const rows = await db
				.select()
				.from(inventoryItems)
				.where(eq(inventoryItems.inventoryId, inventory.id))
				.orderBy(inventoryItems.identityKey);
			return { items: rows.map(restore) };
		},
		async ensure(userId: string) {
			const [inventory] = await db
				.insert(inventories)
				.values({ userId })
				.onConflictDoUpdate({
					target: inventories.userId,
					set: { updatedAt: new Date() },
				})
				.returning({ id: inventories.id });
			if (!inventory) {
				throw new ApiError(
					500,
					"INVENTORY_CREATE_FAILED",
					"Inventory could not be initialized",
				);
			}
			const rows = await db
				.select()
				.from(inventoryItems)
				.where(eq(inventoryItems.inventoryId, inventory.id))
				.orderBy(inventoryItems.identityKey);
			return { items: rows.map(restore) };
		},

		async create(userId: string, input: CreateInventoryItem) {
			const identity = resolveIdentity(input.name);
			return db.transaction(async (tx) => {
				const [inventory] = await tx
					.insert(inventories)
					.values({ userId })
					.onConflictDoUpdate({
						target: inventories.userId,
						set: { updatedAt: new Date() },
					})
					.returning();
				if (!inventory) throw new Error("Inventory creation failed");
				const [item] = await tx
					.insert(inventoryItems)
					.values({
						...identity,
						quantity: input.quantity,
						unit: input.unit,
						isApproximate: input.isApproximate,
						condition: input.condition,
						inventoryId: inventory.id,
					})
					.onConflictDoNothing({
						target: [inventoryItems.inventoryId, inventoryItems.identityKey],
					})
					.returning();
				if (!item)
					throw new ApiError(
						409,
						"DUPLICATE_INVENTORY_ITEM",
						"Ingredient already exists in inventory",
					);
				return restore(item);
			});
		},
		async replace(userId: string, input: ReplaceInventoryItems) {
			const itemsByIdentity = new Map<
				string,
				{ identityKey: string; ingredientKey: string | null; name: string }
			>();
			for (const item of input.items) {
				const ingredient = productionIngredientCatalog.resolveName(item.name);
				const identityKey =
					ingredient?.key ?? normalizeIngredientName(item.name);
				if (!itemsByIdentity.has(identityKey)) {
					itemsByIdentity.set(identityKey, {
						identityKey,
						ingredientKey: ingredient?.key ?? null,
						name: item.name,
					});
				}
			}

			return db.transaction(async (tx) => {
				const [inventory] = await tx
					.insert(inventories)
					.values({ userId })
					.onConflictDoUpdate({
						target: inventories.userId,
						set: { updatedAt: new Date() },
					})
					.returning({ id: inventories.id });
				if (!inventory) throw new Error("Inventory creation failed");

				await tx
					.delete(inventoryItems)
					.where(eq(inventoryItems.inventoryId, inventory.id));
				if (itemsByIdentity.size > 0) {
					await tx.insert(inventoryItems).values(
						[...itemsByIdentity.values()].map((item) => ({
							...item,
							inventoryId: inventory.id,
						})),
					);
				}

				const rows = await tx
					.select()
					.from(inventoryItems)
					.where(eq(inventoryItems.inventoryId, inventory.id))
					.orderBy(inventoryItems.identityKey);
				return { items: rows.map(restore) };
			});
		},
		async update(userId: string, id: string, input: UpdateInventoryItem) {
			const owned = await assertOwned(userId, id);
			const identity = resolveIdentity(input.name);
			const [duplicate] = await db
				.select({ id: inventoryItems.id })
				.from(inventoryItems)
				.where(
					and(
						eq(inventoryItems.inventoryId, owned.inventoryId),
						eq(inventoryItems.identityKey, identity.identityKey),
						ne(inventoryItems.id, id),
					),
				);
			if (duplicate)
				throw new ApiError(
					409,
					"DUPLICATE_INVENTORY_ITEM",
					"Ingredient already exists in inventory",
				);
			let item: typeof inventoryItems.$inferSelect | undefined;
			try {
				[item] = await db
					.update(inventoryItems)
					.set({
						...identity,
						quantity: input.quantity,
						unit: input.unit,
						isApproximate: input.isApproximate,
						condition: input.condition,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(inventoryItems.id, id),
							inArray(inventoryItems.inventoryId, ownedInventories(userId)),
						),
					)
					.returning();
			} catch (error) {
				if (isUniqueViolation(error))
					throw new ApiError(
						409,
						"DUPLICATE_INVENTORY_ITEM",
						"Ingredient already exists in inventory",
					);
				throw error;
			}
			if (!item)
				throw new ApiError(
					404,
					"INVENTORY_ITEM_NOT_FOUND",
					"Inventory item not found",
				);
			return restore(item);
		},
		async delete(userId: string, id: string) {
			await assertOwned(userId, id);
			const rows = await db
				.delete(inventoryItems)
				.where(
					and(
						eq(inventoryItems.id, id),
						inArray(inventoryItems.inventoryId, ownedInventories(userId)),
					),
				)
				.returning({ id: inventoryItems.id });
			if (!rows.length)
				throw new ApiError(
					404,
					"INVENTORY_ITEM_NOT_FOUND",
					"Inventory item not found",
				);
		},
	};
}
