import { eq } from "drizzle-orm";

import { createDatabase } from "./client";
import {
	authCredentials,
	households,
	inventories,
	kitchenEquipment,
	kitchens,
	userProfiles,
	users,
} from "./schema";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is missing");
}

const email = (Bun.env.DEV_USER_EMAIL ?? "dev@flemme.local").toLowerCase();
const password = Bun.env.DEV_USER_PASSWORD ?? "flemme-local-development";
const passwordHash = await Bun.password.hash(password);
const { client, db } = createDatabase(databaseUrl);

try {
	await db.transaction(async (transaction) => {
		const [user] = await transaction
			.insert(users)
			.values({ email })
			.onConflictDoUpdate({
				target: users.email,
				set: { updatedAt: new Date() },
			})
			.returning({ id: users.id });

		if (!user) {
			throw new Error("Development user could not be created");
		}

		await transaction
			.insert(authCredentials)
			.values({ userId: user.id, passwordHash })
			.onConflictDoUpdate({
				target: authCredentials.userId,
				set: { passwordHash, updatedAt: new Date() },
			});

		await transaction
			.insert(userProfiles)
			.values({
				userId: user.id,
				displayName: "Flemme Developer",
				foodPreferences: [],
				cookingPreferences: [],
			})
			.onConflictDoUpdate({
				target: userProfiles.userId,
				set: { displayName: "Flemme Developer", updatedAt: new Date() },
			});

		await transaction
			.insert(households)
			.values({ userId: user.id, adults: 1, children: 0, toddlers: 0 })
			.onConflictDoUpdate({
				target: households.userId,
				set: { adults: 1, children: 0, toddlers: 0, updatedAt: new Date() },
			});

		const [kitchen] = await transaction
			.insert(kitchens)
			.values({ userId: user.id })
			.onConflictDoUpdate({
				target: kitchens.userId,
				set: { updatedAt: new Date() },
			})
			.returning({ id: kitchens.id });

		if (!kitchen) {
			throw new Error("Development kitchen could not be created");
		}

		await transaction
			.insert(kitchenEquipment)
			.values([
				{ kitchenId: kitchen.id, name: "gas stove" },
				{ kitchenId: kitchen.id, name: "wok" },
			])
			.onConflictDoNothing();

		await transaction
			.insert(inventories)
			.values({ userId: user.id })
			.onConflictDoUpdate({
				target: inventories.userId,
				set: { updatedAt: new Date() },
			});

		const [seededUser] = await transaction
			.select({ id: users.id, email: users.email })
			.from(users)
			.where(eq(users.id, user.id));

		console.log("Development database seed is ready:", seededUser);
	});
} finally {
	await client.end();
}
