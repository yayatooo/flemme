import { pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { users } from "../auth/user";

export const kitchens = pgTable(
	"kitchens",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [unique("kitchens_user_id_unique").on(table.userId)],
);
