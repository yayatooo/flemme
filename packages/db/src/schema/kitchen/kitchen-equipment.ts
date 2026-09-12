import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { kitchens } from "./kitchen";

export const kitchenEquipment = pgTable(
	"kitchen_equipment",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		kitchenId: uuid("kitchen_id")
			.notNull()
			.references(() => kitchens.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("kitchen_equipment_kitchen_id_name_unique").on(
			table.kitchenId,
			table.name,
		),
	],
);
