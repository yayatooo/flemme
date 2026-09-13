import { describe, expect, test } from "bun:test";

import { normalizeIngredientUnit } from "./normalize-ingredient-unit";

describe("normalizeIngredientUnit", () => {
	test.each([
		["g", "g"],
		[" gram ", "g"],
		["KG", "kg"],
		["kilogram", "kg"],
		["sdm", "tbsp"],
		["  sendok   makan ", "tbsp"],
		["sdt", "tsp"],
		["siung", "clove"],
		["butir", "piece"],
	] as const)("normalizes %s to %s", (input, expected) => {
		expect(normalizeIngredientUnit(input)).toBe(expected);
	});

	test("does not parse qualified or unsupported units", () => {
		expect(
			normalizeIngredientUnit("sendok makan (kisaran 2–3)"),
		).toBeUndefined();
		expect(normalizeIngredientUnit("secukupnya")).toBeUndefined();
		expect(normalizeIngredientUnit("cup")).toBeUndefined();
	});
});
