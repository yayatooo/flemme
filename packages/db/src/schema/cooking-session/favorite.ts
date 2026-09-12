import {
	foreignKey,
	pgTable,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

import { cookingSessions } from "./cooking-session";

export const favorites = pgTable(
	"favorites",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").notNull(),
		cookingSessionId: uuid("cooking_session_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			name: "favorites_cooking_session_user_fk",
			columns: [table.cookingSessionId, table.userId],
			foreignColumns: [cookingSessions.id, cookingSessions.userId],
		}).onDelete("cascade"),
		unique("favorites_user_id_cooking_session_id_unique").on(
			table.userId,
			table.cookingSessionId,
		),
	],
);
