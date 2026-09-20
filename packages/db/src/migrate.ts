import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDatabase } from "./client";

const databaseUrl = Bun.env.DATABASE_URL;
const migrationsFolder =
	Bun.env.DRIZZLE_MIGRATIONS_DIR ?? `${import.meta.dir}/../drizzle`;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is missing");
}

const { client, db } = createDatabase(databaseUrl);

try {
	await migrate(db, { migrationsFolder });
	console.log("Database migrations applied.");
} finally {
	await client.end();
}
