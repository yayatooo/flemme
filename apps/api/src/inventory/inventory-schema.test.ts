import { expect, test } from "bun:test";
import { CreateInventoryItemSchema } from "./inventory-schema";

test("quantity precision, nullable pair and strict inventory contracts", () => {
	const base = { ingredientKey: "egg", quantity: 1.125, unit: "g" };
	expect(CreateInventoryItemSchema.safeParse(base).success).toBe(true);
	expect(
		CreateInventoryItemSchema.safeParse({ ...base, quantity: null, unit: null })
			.success,
	).toBe(true);
	for (const quantity of [0, -1, 0.0001, Infinity, NaN, 100_000_000_000])
		expect(
			CreateInventoryItemSchema.safeParse({ ...base, quantity }).success,
		).toBe(false);
	expect(
		CreateInventoryItemSchema.safeParse({ ...base, unit: null }).success,
	).toBe(false);
	expect(
		CreateInventoryItemSchema.safeParse({ ...base, userId: "untrusted" })
			.success,
	).toBe(false);
});
