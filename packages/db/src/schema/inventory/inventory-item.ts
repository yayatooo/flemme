import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

import { inventories } from "./inventory";

export const inventoryConditionEnum = pgEnum("inventory_condition", [
	"fresh",
	"use_soon",
	"unknown",
]);

export const inventoryItems = pgTable(
	"inventory_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		inventoryId: uuid("inventory_id")
			.notNull()
			.references(() => inventories.id, { onDelete: "cascade" }),
		ingredientKey: text("ingredient_key").notNull(),
		quantity: numeric("quantity", {
			precision: 14,
			scale: 3,
			mode: "number",
		}),
		unit: text("unit"),
		isApproximate: boolean("is_approximate").notNull().default(false),
		condition: inventoryConditionEnum("condition").notNull().default("unknown"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("inventory_items_inventory_id_ingredient_key_unique").on(
			table.inventoryId,
			table.ingredientKey,
		),
		check(
			"inventory_items_ingredient_key_kebab_case",
			sql`${table.ingredientKey} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
		),
		check(
			"inventory_items_quantity_positive",
			sql`${table.quantity} is null or ${table.quantity} > 0`,
		),
		check(
			"inventory_items_quantity_unit_pair",
			sql`(${table.quantity} is null and ${table.unit} is null) or (${table.quantity} is not null and length(trim(${table.unit})) > 0)`,
		),
	],
);
