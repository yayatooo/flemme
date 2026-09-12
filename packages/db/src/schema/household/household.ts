import { sql } from "drizzle-orm";
import {
	check,
	integer,
	pgTable,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

import { users } from "../auth/user";

export const households = pgTable(
	"households",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		adults: integer("adults").notNull().default(1),
		children: integer("children").notNull().default(0),
		toddlers: integer("toddlers").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("households_user_id_unique").on(table.userId),
		check(
			"households_counts_non_negative",
			sql`${table.adults} >= 0 and ${table.children} >= 0 and ${table.toddlers} >= 0`,
		),
	],
);
