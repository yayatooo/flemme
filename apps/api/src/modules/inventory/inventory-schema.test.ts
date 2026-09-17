import { expect, test } from "bun:test";
import {
	CreateInventoryItemSchema,
	ReplaceInventoryItemsSchema,
} from "./inventory-schema";

test("name normalization, quantity precision, nullable pair and strict contracts", () => {
	const base = { name: "  Egg  ", quantity: 1.125, unit: " g " };
	expect(CreateInventoryItemSchema.parse(base)).toEqual({
		name: "Egg",
		quantity: 1.125,
		unit: "g",
		isApproximate: false,
		condition: "unknown",
	});
	expect(
		CreateInventoryItemSchema.safeParse({ name: "Daun gedi" }).success,
	).toBe(true);
	expect(
		CreateInventoryItemSchema.safeParse({
			...base,
			quantity: null,
			unit: null,
		}).success,
	).toBe(true);
	for (const quantity of [0, -1, 0.0001, Infinity, NaN, 100_000_000_000])
		expect(
			CreateInventoryItemSchema.safeParse({ ...base, quantity }).success,
		).toBe(false);
	for (const invalid of [
		{ ...base, unit: null },
		{ ...base, name: " " },
		{ ...base, name: "x".repeat(121) },
		{ ...base, ingredientKey: "egg" },
		{ ...base, userId: "untrusted" },
	]) {
		expect(CreateInventoryItemSchema.safeParse(invalid).success).toBe(false);
	}
});

test("onboarding inventory accepts normalized names and an empty list", () => {
	expect(
		ReplaceInventoryItemsSchema.parse({
			items: [{ name: "  Daun   Gedi  " }, { name: "Telur" }],
		}),
	).toEqual({ items: [{ name: "Daun Gedi" }, { name: "Telur" }] });
	expect(ReplaceInventoryItemsSchema.parse({ items: [] })).toEqual({
		items: [],
	});
	for (const input of [
		{ items: [{ name: " " }] },
		{ items: [{ name: "x".repeat(121) }] },
		{ items: [{ name: "Egg", ingredientKey: "egg" }] },
		{},
	]) {
		expect(ReplaceInventoryItemsSchema.safeParse(input).success).toBe(false);
	}
});
