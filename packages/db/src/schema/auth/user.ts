import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		email: text("email").notNull().unique(),
		name: text("name").notNull().default("Flemme user"),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
	],
);
