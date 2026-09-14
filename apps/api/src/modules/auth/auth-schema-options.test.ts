import { expect, test } from "bun:test";
import * as schema from "@flemme/db";
import { getAuthTables } from "better-auth/db";
import { getTableColumns } from "drizzle-orm";
import { authSchemaOptions } from "./auth-schema-options";

test("pinned Better Auth metadata matches Drizzle fields and UUIDs", () => {
	const tables = {
		users: schema.users,
		authAccounts: schema.authAccounts,
		authSessions: schema.authSessions,
		authVerifications: schema.authVerifications,
	};
	for (const model of Object.values(getAuthTables(authSchemaOptions))) {
		const table = tables[model.modelName as keyof typeof tables];
		expect(table).toBeDefined();
		const columns = getTableColumns(table);
		expect(columns.id.getSQLType()).toBe("uuid");
		for (const [key, field] of Object.entries(model.fields)) {
			const column = columns[(field.fieldName ?? key) as keyof typeof columns];
			expect(column).toBeDefined();
			if (field.required) expect(column.notNull).toBe(true);
		}
	}
	expect(authSchemaOptions.advanced.database.generateId).toBe("uuid");
	expect(authSchemaOptions.account.accountLinking.disableImplicitLinking).toBe(
		true,
	);
});
test("future password policy preserves Bun Argon2id compatibility", async () => {
	const password = "A1-test-only-password";
	const hash = await Bun.password.hash(password);
	expect(hash.startsWith("$argon2id$")).toBe(true);
	expect(
		await authSchemaOptions.emailAndPassword.password.verify({
			password,
			hash,
		}),
	).toBe(true);
	expect(
		await authSchemaOptions.emailAndPassword.password.verify({
			password: "wrong",
			hash,
		}),
	).toBe(false);
});
