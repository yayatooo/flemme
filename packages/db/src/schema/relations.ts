import { relations } from "drizzle-orm";

import { authCredentials } from "./auth/auth-credential";
import { authSessions } from "./auth/auth-session";
import { users } from "./auth/user";
import { cookingSessions } from "./cooking-session/cooking-session";
import { favorites } from "./cooking-session/favorite";
import { households } from "./household/household";
import { inventories } from "./inventory/inventory";
import { inventoryItems } from "./inventory/inventory-item";
import { kitchens } from "./kitchen/kitchen";
import { kitchenEquipment } from "./kitchen/kitchen-equipment";
import { userProfiles } from "./user-profile/user-profile";

export const usersRelations = relations(users, ({ many, one }) => ({
	credential: one(authCredentials),
	authSessions: many(authSessions),
	profile: one(userProfiles),
	household: one(households),
	kitchen: one(kitchens),
	inventory: one(inventories),
	cookingSessions: many(cookingSessions),
}));

export const authCredentialsRelations = relations(
	authCredentials,
	({ one }) => ({
		user: one(users, {
			fields: [authCredentials.userId],
			references: [users.id],
		}),
	}),
);

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
	user: one(users, {
		fields: [authSessions.userId],
		references: [users.id],
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id],
	}),
}));

export const householdsRelations = relations(households, ({ one }) => ({
	user: one(users, {
		fields: [households.userId],
		references: [users.id],
	}),
}));

export const kitchensRelations = relations(kitchens, ({ many, one }) => ({
	user: one(users, {
		fields: [kitchens.userId],
		references: [users.id],
	}),
	equipment: many(kitchenEquipment),
}));

export const kitchenEquipmentRelations = relations(
	kitchenEquipment,
	({ one }) => ({
		kitchen: one(kitchens, {
			fields: [kitchenEquipment.kitchenId],
			references: [kitchens.id],
		}),
	}),
);

export const inventoriesRelations = relations(inventories, ({ many, one }) => ({
	user: one(users, {
		fields: [inventories.userId],
		references: [users.id],
	}),
	items: many(inventoryItems),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
	inventory: one(inventories, {
		fields: [inventoryItems.inventoryId],
		references: [inventories.id],
	}),
}));

export const cookingSessionsRelations = relations(
	cookingSessions,
	({ many, one }) => ({
		user: one(users, {
			fields: [cookingSessions.userId],
			references: [users.id],
		}),
		favorites: many(favorites),
	}),
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
	cookingSession: one(cookingSessions, {
		fields: [favorites.cookingSessionId, favorites.userId],
		references: [cookingSessions.id, cookingSessions.userId],
	}),
}));
