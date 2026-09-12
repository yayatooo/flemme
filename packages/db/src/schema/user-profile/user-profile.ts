import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "../auth/user";

export const userProfiles = pgTable("user_profiles", {
	userId: uuid("user_id")
		.primaryKey()
		.references(() => users.id, { onDelete: "cascade" }),
	displayName: text("display_name"),
	foodPreferences: text("food_preferences").array().notNull().default([]),
	cookingPreferences: text("cooking_preferences").array().notNull().default([]),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
