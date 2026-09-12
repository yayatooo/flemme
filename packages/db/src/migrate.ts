import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDatabase } from "./client";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is missing");
}

const { client, db } = createDatabase(databaseUrl);

try {
	await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
	console.log("Database migrations applied.");
} finally {
	await client.end();
}
