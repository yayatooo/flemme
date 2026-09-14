import { expect, test } from "bun:test";
import postgres from "postgres";

const databaseUrl = Bun.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL required");
test("A1 upgrades legacy rows preserving identity, hashes and ownership", async () => {
	const client = postgres(databaseUrl, { max: 1 });
	const namespace = `auth_a1_${crypto.randomUUID().replaceAll("-", "")}`;
	const hash = await Bun.password.hash("migration-test-password");
	try {
		await client.begin(async (tx) => {
			await tx.unsafe(`CREATE SCHEMA "${namespace}"`);
			await tx.unsafe(`SET LOCAL search_path TO "${namespace}"`);
			const initial = await Bun.file(
				`${import.meta.dir}/../../drizzle/0000_lovely_veda.sql`,
			).text();
			await tx.unsafe(initial.replaceAll('"public".', `"${namespace}".`));
			const [user] =
				await tx`INSERT INTO users(email) VALUES ('migration@example.com') RETURNING *`;
			if (!user) throw new Error("Missing user");
			await tx`INSERT INTO auth_credentials(user_id,password_hash) VALUES (${user.id},${hash})`;
			await tx`INSERT INTO user_profiles(user_id,display_name) VALUES (${user.id},'Do not copy')`;
			await tx`INSERT INTO households(user_id) VALUES (${user.id})`;
			await tx`INSERT INTO kitchens(user_id) VALUES (${user.id})`;
			await tx`INSERT INTO inventories(user_id) VALUES (${user.id})`;
			await tx`INSERT INTO auth_sessions(user_id,token_hash,expires_at) VALUES (${user.id},'legacy-hash',now()+interval '1 day')`;
			const migration = await Bun.file(
				`${import.meta.dir}/../../drizzle/0001_brainy_stone_men.sql`,
			).text();
			await tx.unsafe(migration.replaceAll('"public".', `"${namespace}".`));
			const [after] = await tx`SELECT * FROM users`;
			expect(after?.id).toBe(user.id);
			expect(after?.email).toBe(user.email);
			expect(after?.name).toBe("Flemme user");
			expect(after?.email_verified).toBe(false);
			const accounts = await tx`SELECT * FROM auth_accounts`;
			expect(accounts).toHaveLength(1);
			expect(accounts[0]?.password).toBe(hash);
			expect(accounts[0]?.account_id).toBe(user.id);
			expect(accounts[0]?.user_id).toBe(user.id);
			expect(accounts[0]?.provider_id).toBe("credential");
			expect(
				await Bun.password.verify(
					"migration-test-password",
					accounts[0]?.password,
				),
			).toBe(true);
			expect(await tx`SELECT * FROM auth_sessions`).toHaveLength(0);
			for (const table of [
				"user_profiles",
				"households",
				"kitchens",
				"inventories",
			]) {
				const rows = await tx.unsafe(`SELECT user_id FROM "${table}"`);
				expect(rows).toHaveLength(1);
				expect(rows[0]?.user_id).toBe(user.id);
			}
			// No Google identity is created: only verify nullable password schema metadata.
			const [password] =
				await tx`SELECT is_nullable FROM information_schema.columns WHERE table_schema=${namespace} AND table_name='auth_accounts' AND column_name='password'`;
			expect(password?.is_nullable).toBe("YES");
			await tx`SELECT * FROM auth_verifications`;
			// Roll back the isolated schema and all data, even on successful validation.
			throw new Error("A1_TEST_ROLLBACK");
		});
	} catch (error) {
		if (!(error instanceof Error) || error.message !== "A1_TEST_ROLLBACK")
			throw error;
	} finally {
		await client.end();
	}
});
