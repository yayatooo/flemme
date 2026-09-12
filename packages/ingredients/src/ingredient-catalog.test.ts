import { describe, expect, test } from "bun:test";

import type { CanonicalIngredient } from "./contracts";
import { TEST_INGREDIENT_CATALOG } from "./fixtures/test-ingredient-catalog";
import {
	createIngredientCatalog,
	resolveIngredient,
} from "./ingredient-catalog";

const CHICKEN_THIGH: CanonicalIngredient = {
	key: "chicken-thigh",
	names: { id: "Ayam paha", en: "Chicken thigh" },
	aliases: { id: ["Paha ayam"], en: ["Chicken thighs"] },
};

describe("ingredient catalog", () => {
	test.each([
		["Ayam paha", "chicken-thigh"],
		["Chicken thigh", "chicken-thigh"],
		["Paha ayam", "chicken-thigh"],
		["KECAP MANIS", "sweet-soy-sauce"],
		["  kecap   manis ", "sweet-soy-sauce"],
	] as const)("resolves %s to %s", (query, expectedKey) => {
		const result = resolveIngredient({
			query,
			catalog: TEST_INGREDIENT_CATALOG,
		});

		expect(result.status).toBe("resolved");
		if (result.status === "resolved") {
			expect(result.ingredient.key).toBe(expectedKey);
		}
	});

	test("returns unresolved for an unknown name without fuzzy guessing", () => {
		expect(
			resolveIngredient({
				query: "aym phaa",
				catalog: TEST_INGREDIENT_CATALOG,
			}),
		).toEqual({ status: "unresolved", query: "aym phaa" });
	});

	test("supports canonical-key lookup", () => {
		expect(TEST_INGREDIENT_CATALOG.getByKey("garlic")?.names.id).toBe(
			"Bawang putih",
		);
		expect(TEST_INGREDIENT_CATALOG.getByKey("unknown")).toBeUndefined();
	});

	test("rejects duplicate canonical keys", () => {
		expect(() =>
			createIngredientCatalog({
				ingredients: [CHICKEN_THIGH, CHICKEN_THIGH],
			}),
		).toThrow();
	});

	test("rejects a normalized alias collision", () => {
		expect(() =>
			createIngredientCatalog({
				ingredients: [
					CHICKEN_THIGH,
					{
						key: "whole-chicken",
						names: { id: "Ayam utuh", en: "Whole chicken" },
						aliases: { id: ["  AYAM   PAHA "], en: [] },
					},
				],
			}),
		).toThrow();
	});

	test("rejects a collision across language groups", () => {
		expect(() =>
			createIngredientCatalog({
				ingredients: [
					CHICKEN_THIGH,
					{
						key: "unrelated-ingredient",
						names: { id: "Bahan lain", en: "Paha ayam" },
						aliases: { id: [], en: [] },
					},
				],
			}),
		).toThrow();
	});

	test("rejects keys that are not stable kebab-case identifiers", () => {
		expect(() =>
			createIngredientCatalog({
				ingredients: [{ ...CHICKEN_THIGH, key: "Chicken Thigh" }],
			}),
		).toThrow();
	});
});
