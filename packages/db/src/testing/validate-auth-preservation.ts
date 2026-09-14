import { strict as assert } from "node:assert";
import postgres from "postgres";

if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const client = postgres(Bun.env.DATABASE_URL, { max: 1 });
try {
	const domainTables = [
		"user_profiles",
		"households",
		"kitchens",
		"kitchen_equipment",
		"inventories",
		"inventory_items",
		"cooking_sessions",
		"favorites",
	];
	const beforeUsers =
		await client`SELECT id,email,created_at,updated_at FROM users ORDER BY id`;
	const invalid = beforeUsers.filter(
		(row) =>
			row.email !== row.email.trim().toLowerCase() ||
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email),
	);
	assert.equal(
		invalid.length,
		0,
		"Existing emails require manual review; no migration applied",
	);
	const [legacy] =
		await client`SELECT to_regclass('public.auth_credentials') IS NOT NULL AS exists`;
	const credentials = legacy?.exists
		? await client`SELECT id,user_id,password_hash,created_at,updated_at FROM auth_credentials ORDER BY id`
		: [];
	const before = new Map<string, unknown>();
	for (const table of domainTables)
		before.set(
			table,
			await client.unsafe(
				`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY to_jsonb(t)::text`,
			),
		);
	const [sessions] =
		await client`SELECT count(*)::int AS count FROM auth_sessions`;
	console.log("Preflight", {
		users: beforeUsers.length,
		legacyCredentials: credentials.length,
		sessions: sessions?.count,
		incompatibleEmails: invalid.length,
		representativeUserIds: beforeUsers.slice(0, 3).map((row) => row.id),
	});
	console.log(
		"Product Domain row counts",
		Object.fromEntries(
			[...before].map(([name, rows]) => [name, (rows as unknown[]).length]),
		),
	);
	if (Bun.argv.includes("--check-only")) process.exit(0);
	const processResult = Bun.spawn(["bun", "run", "db:migrate"], {
		cwd: `${import.meta.dir}/../..`,
		stdout: "inherit",
		stderr: "inherit",
	});
	assert.equal(await processResult.exited, 0, "Migration failed");
	assert.deepEqual(
		await client`SELECT id,email,created_at,updated_at FROM users ORDER BY id`,
		beforeUsers,
	);
	for (const table of domainTables)
		assert.deepEqual(
			await client.unsafe(
				`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY to_jsonb(t)::text`,
			),
			before.get(table),
			`${table} changed`,
		);
	for (const credential of credentials) {
		const [account] =
			await client`SELECT * FROM auth_accounts WHERE id=${credential.id}`;
		assert.ok(account);
		assert.equal(account.user_id, credential.user_id);
		assert.equal(account.account_id, credential.user_id);
		assert.equal(account.provider_id, "credential");
		assert.equal(account.password, credential.password_hash);
		assert.deepEqual(account.created_at, credential.created_at);
		assert.deepEqual(account.updated_at, credential.updated_at);
	}
	const accounts =
		await client`SELECT * FROM auth_accounts WHERE provider_id='credential'`;
	if (legacy?.exists) {
		assert.equal(accounts.length, credentials.length);
		assert.equal((await client`SELECT * FROM auth_sessions`).length, 0);
	}
	const seedEmail = (
		Bun.env.DEV_USER_EMAIL ?? "dev@flemme.local"
	).toLowerCase();
	const [seed] =
		await client`SELECT a.password FROM auth_accounts a JOIN users u ON u.id=a.user_id WHERE a.provider_id='credential' AND u.email=${seedEmail}`;
	const seedVerified = seed
		? await Bun.password.verify(
				Bun.env.DEV_USER_PASSWORD ?? "flemme-local-development",
				seed.password,
			)
		: null;
	console.log("Preservation passed", {
		usersBefore: beforeUsers.length,
		usersAfter: beforeUsers.length,
		credentialsBefore: credentials.length,
		credentialAccountsAfter: accounts.length,
		exactHashesPreserved: credentials.length,
		allDomainRowsUnchanged: true,
		seedPasswordVerified: seedVerified,
	});
} finally {
	await client.end();
}
