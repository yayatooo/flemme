import { describe, expect, test } from "bun:test";

import {
	PRODUCTION_CANONICAL_INGREDIENTS,
	productionIngredientCatalog,
} from "./production-ingredient-catalog";

describe("production ingredient catalog", () => {
	test("contains the reviewed v0.1 ingredient set", () => {
		expect(PRODUCTION_CANONICAL_INGREDIENTS).toHaveLength(10);
		expect(PRODUCTION_CANONICAL_INGREDIENTS.map(({ key }) => key)).toEqual([
			"egg",
			"garlic",
			"shallot",
			"raw-white-rice",
			"boneless-skinless-chicken-thigh",
			"canola-oil",
			"table-salt",
			"tomato",
			"carrot",
			"potato",
		]);
	});

	test.each([
		["Telur", "egg"],
		["BAWANG PUTIH", "garlic"],
		["  bawang   merah ", "shallot"],
		["Beras", "raw-white-rice"],
		["Garam", "table-salt"],
		["Kentang", "potato"],
	] as const)("resolves %s deterministically", (query, expectedKey) => {
		expect(productionIngredientCatalog.resolveName(query)?.key).toBe(
			expectedKey,
		);
	});

	test("does not approximate unsupported concepts", () => {
		expect(
			productionIngredientCatalog.resolveName("kecap manis"),
		).toBeUndefined();
		expect(
			productionIngredientCatalog.resolveName("minyak goreng"),
		).toBeUndefined();
		expect(
			productionIngredientCatalog.resolveName("nasi putih"),
		).toBeUndefined();
	});
});
