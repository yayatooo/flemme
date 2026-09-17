import { describe, expect, test } from "bun:test";
import { productionIngredientCatalog } from "@flemme/ingredients";

import { calculateRecipeNutrition } from "../calculate-recipe-nutrition";
import { normalizeIngredient } from "../normalization/normalize-ingredient";
import { validateIngredientReferenceIntegrity } from "../validate-ingredient-reference-integrity";
import { ProductionNutritionReferenceCollectionSchema } from "./contracts";
import {
	PRODUCTION_INGREDIENT_UNIT_CONVERSIONS,
	PRODUCTION_NUTRITION_DATA,
	PRODUCTION_NUTRITION_REFERENCES,
} from "./production-nutrition-data";

describe("production USDA nutrition data", () => {
	test("contains ten schema-valid, traceable, canonical mappings", () => {
		expect(PRODUCTION_NUTRITION_DATA).toHaveLength(10);
		expect(
			ProductionNutritionReferenceCollectionSchema.parse(
				PRODUCTION_NUTRITION_DATA,
			),
		).toEqual(PRODUCTION_NUTRITION_DATA);

		for (const reference of PRODUCTION_NUTRITION_DATA) {
			expect(
				productionIngredientCatalog.getByKey(reference.ingredientKey),
			).toBeDefined();
			expect(reference.source.provider).toBe("usda-fooddata-central");
			expect(reference.source.sourceUrl).toContain(
				String(reference.source.fdcId),
			);
		}
	});

	test("passes canonical reference and conversion integrity", () => {
		expect(
			validateIngredientReferenceIntegrity({
				catalog: productionIngredientCatalog,
				nutritionReferences: PRODUCTION_NUTRITION_REFERENCES,
				unitConversions: PRODUCTION_INGREDIENT_UNIT_CONVERSIONS,
			}),
		).toEqual({ status: "valid" });
	});

	test("rejects duplicate production ingredient and FDC mappings", () => {
		expect(() =>
			ProductionNutritionReferenceCollectionSchema.parse([
				PRODUCTION_NUTRITION_DATA[0],
				PRODUCTION_NUTRITION_DATA[0],
			]),
		).toThrow();
	});

	test("rejects ambiguous duplicate portion units", () => {
		const canola = PRODUCTION_NUTRITION_DATA.find(
			(reference) => reference.ingredientKey === "canola-oil",
		);

		expect(canola).toBeDefined();
		if (!canola) {
			throw new Error("Expected the production canola reference");
		}

		expect(() =>
			ProductionNutritionReferenceCollectionSchema.parse([
				{
					...canola,
					portions: [canola.portions[0], canola.portions[0]],
				},
			]),
		).toThrow();
	});

	test("derives only the five reviewed source-backed unit conversions", () => {
		expect(PRODUCTION_INGREDIENT_UNIT_CONVERSIONS).toEqual([
			{ ingredientKey: "shallot", unit: "tbsp", gramsPerUnit: 10 },
			{ ingredientKey: "canola-oil", unit: "tsp", gramsPerUnit: 4.5 },
			{ ingredientKey: "canola-oil", unit: "tbsp", gramsPerUnit: 14 },
			{ ingredientKey: "table-salt", unit: "tsp", gramsPerUnit: 6 },
			{ ingredientKey: "table-salt", unit: "tbsp", gramsPerUnit: 18 },
		]);
	});

	test("calculates from direct grams with the committed USDA reference", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 2,
				ingredients: [{ ingredientKey: "egg", name: "Telur", grams: 100 }],
			},
			references: PRODUCTION_NUTRITION_REFERENCES,
		});

		expect(result).toEqual({
			status: "complete",
			estimated: true,
			servings: 2,
			includedIngredients: [
				{ ingredientKey: "egg", name: "Telur", grams: 100 },
			],
			total: {
				caloriesKcal: 143,
				proteinG: 12.6,
				carbsG: 0.72,
				fatG: 9.51,
			},
			perServing: {
				caloriesKcal: 71.5,
				proteinG: 6.3,
				carbsG: 0.36,
				fatG: 4.755,
			},
		});
	});

	test("normalizes a reviewed canola-oil tablespoon portion", () => {
		expect(
			normalizeIngredient({
				ingredient: {
					ingredientKey: "canola-oil",
					name: "Minyak kanola",
					quantity: 1.5,
					unit: "tbsp",
				},
				conversions: PRODUCTION_INGREDIENT_UNIT_CONVERSIONS,
			}),
		).toEqual({
			status: "normalized",
			ingredient: {
				ingredientKey: "canola-oil",
				name: "Minyak kanola",
				grams: 21,
			},
		});
	});

	test("does not collapse size-specific egg portions into piece", () => {
		expect(
			normalizeIngredient({
				ingredient: {
					ingredientKey: "egg",
					name: "Telur",
					quantity: 1,
					unit: "piece",
				},
				conversions: PRODUCTION_INGREDIENT_UNIT_CONVERSIONS,
			}),
		).toMatchObject({ status: "unresolved", reason: "missing-conversion" });
	});
});
