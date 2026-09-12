import { describe, expect, test } from "bun:test";

import { calculateRecipeNutrition } from "../calculate-recipe-nutrition";
import {
	type IngredientNormalizationInput,
	IngredientNormalizationInputSchema,
	type IngredientUnitConversion,
} from "./contracts";
import { normalizeIngredient } from "./normalize-ingredient";
import { normalizeRecipeIngredients } from "./normalize-recipe-ingredients";

const SOY_SAUCE_TABLESPOON: IngredientUnitConversion = {
	ingredientKey: "synthetic-soy-sauce",
	unit: "tbsp",
	gramsPerUnit: 20,
};

function ingredient(
	overrides: Partial<IngredientNormalizationInput> = {},
): IngredientNormalizationInput {
	return {
		ingredientKey: "synthetic-ingredient",
		name: "Synthetic ingredient",
		quantity: 1,
		unit: "g",
		...overrides,
	};
}

describe("normalizeIngredient", () => {
	test("preserves grams directly", () => {
		expect(
			normalizeIngredient({
				ingredient: ingredient({ quantity: 100, unit: "g" }),
				conversions: [],
			}),
		).toEqual({
			status: "normalized",
			ingredient: {
				ingredientKey: "synthetic-ingredient",
				name: "Synthetic ingredient",
				grams: 100,
			},
		});
	});

	test("converts kilograms directly", () => {
		const result = normalizeIngredient({
			ingredient: ingredient({ quantity: 1.5, unit: "kg" }),
			conversions: [],
		});

		expect(result.status).toBe("normalized");
		if (result.status === "normalized") {
			expect(result.ingredient.grams).toBe(1_500);
		}
	});

	test("uses an ingredient-specific tablespoon conversion", () => {
		const result = normalizeIngredient({
			ingredient: ingredient({
				ingredientKey: "synthetic-soy-sauce",
				name: "Synthetic soy sauce",
				quantity: 1,
				unit: "tbsp",
			}),
			conversions: [SOY_SAUCE_TABLESPOON],
		});

		expect(result.status).toBe("normalized");
		if (result.status === "normalized") {
			expect(result.ingredient.grams).toBe(20);
		}
	});

	test("multiplies an ingredient-specific teaspoon conversion", () => {
		const result = normalizeIngredient({
			ingredient: ingredient({
				ingredientKey: "synthetic-seasoning",
				quantity: 2.5,
				unit: "tsp",
			}),
			conversions: [
				{
					ingredientKey: "synthetic-seasoning",
					unit: "tsp",
					gramsPerUnit: 4,
				},
			],
		});

		expect(result.status).toBe("normalized");
		if (result.status === "normalized") {
			expect(result.ingredient.grams).toBe(10);
		}
	});

	test("converts cloves only with a matching ingredient reference", () => {
		const result = normalizeIngredient({
			ingredient: ingredient({
				ingredientKey: "synthetic-garlic",
				name: "Synthetic garlic",
				quantity: 3,
				unit: "clove",
			}),
			conversions: [
				{
					ingredientKey: "synthetic-garlic",
					unit: "clove",
					gramsPerUnit: 3,
				},
			],
		});

		expect(result.status).toBe("normalized");
		if (result.status === "normalized") {
			expect(result.ingredient.grams).toBe(9);
		}
	});

	test.each([
		["ml", 1.2, 250, 300],
		["l", 900, 0.5, 450],
		["piece", 75, 2, 150],
	] as const)(
		"uses a direct-to-grams conversion for %s",
		(unit, gramsPerUnit, quantity, expectedGrams) => {
			const result = normalizeIngredient({
				ingredient: ingredient({ quantity, unit }),
				conversions: [
					{
						ingredientKey: "synthetic-ingredient",
						unit,
						gramsPerUnit,
					},
				],
			});

			expect(result.status).toBe("normalized");
			if (result.status === "normalized") {
				expect(result.ingredient.grams).toBe(expectedGrams);
			}
		},
	);

	test("returns unresolved when a valid unit lacks a matching conversion", () => {
		const inputIngredient = ingredient({
			ingredientKey: "synthetic-soy-sauce",
			name: "Synthetic soy sauce",
			quantity: 2,
			unit: "tbsp",
		});

		expect(
			normalizeIngredient({ ingredient: inputIngredient, conversions: [] }),
		).toEqual({
			status: "unresolved",
			...inputIngredient,
			reason: "missing-conversion",
		});
	});

	test("does not apply another ingredient's unit conversion", () => {
		const result = normalizeIngredient({
			ingredient: ingredient({
				ingredientKey: "different-sauce",
				unit: "tbsp",
			}),
			conversions: [SOY_SAUCE_TABLESPOON],
		});

		expect(result.status).toBe("unresolved");
	});

	test("rejects unsupported and ambiguous units", () => {
		for (const unit of ["cup", "pinch", "handful", "to-taste"]) {
			expect(
				IngredientNormalizationInputSchema.safeParse(
					ingredient({ unit: unit as never }),
				).success,
			).toBeFalse();
		}
	});

	test.each([0, -1, Number.POSITIVE_INFINITY])(
		"rejects an invalid quantity: %s",
		(quantity) => {
			expect(() =>
				normalizeIngredient({
					ingredient: ingredient({ quantity }),
					conversions: [],
				} as never),
			).toThrow();
		},
	);

	test("rejects non-positive conversion factors", () => {
		for (const gramsPerUnit of [0, -1]) {
			expect(() =>
				normalizeIngredient({
					ingredient: ingredient({ unit: "piece" }),
					conversions: [
						{
							ingredientKey: "synthetic-ingredient",
							unit: "piece",
							gramsPerUnit,
						},
					],
				} as never),
			).toThrow();
		}
	});

	test("preserves fractional grams without rounding", () => {
		const result = normalizeIngredient({
			ingredient: ingredient({ quantity: 1.5, unit: "tsp" }),
			conversions: [
				{
					ingredientKey: "synthetic-ingredient",
					unit: "tsp",
					gramsPerUnit: 2.75,
				},
			],
		});

		expect(result.status).toBe("normalized");
		if (result.status === "normalized") {
			expect(result.ingredient.grams).toBe(4.125);
		}
	});
});

describe("normalizeRecipeIngredients", () => {
	test("separates normalized and unresolved rows while preserving duplicates", () => {
		const result = normalizeRecipeIngredients({
			ingredients: [
				ingredient({ quantity: 10 }),
				ingredient({ quantity: 5 }),
				ingredient({
					ingredientKey: "unknown-sauce",
					name: "Unknown sauce",
					quantity: 1,
					unit: "tbsp",
				}),
			],
			conversions: [],
		});

		expect(result.normalized.map(({ grams }) => grams)).toEqual([10, 5]);
		expect(result.unresolved).toHaveLength(1);
		expect(result.unresolved[0]?.ingredientKey).toBe("unknown-sauce");
	});

	test("rejects duplicate ingredient-unit conversion pairs", () => {
		expect(() =>
			normalizeRecipeIngredients({
				ingredients: [ingredient({ unit: "tbsp" })],
				conversions: [
					{
						ingredientKey: "synthetic-ingredient",
						unit: "tbsp",
						gramsPerUnit: 10,
					},
					{
						ingredientKey: "synthetic-ingredient",
						unit: "tbsp",
						gramsPerUnit: 12,
					},
				],
			} as never),
		).toThrow();
	});

	test("produces amounts accepted directly by the nutrition calculator", () => {
		const normalization = normalizeRecipeIngredients({
			ingredients: [
				ingredient({ quantity: 150, unit: "g" }),
				{
					ingredientKey: "synthetic-soy-sauce",
					name: "Synthetic soy sauce",
					quantity: 2,
					unit: "tbsp",
				},
			],
			conversions: [SOY_SAUCE_TABLESPOON],
		});

		expect(normalization.unresolved).toEqual([]);

		const nutrition = calculateRecipeNutrition({
			recipe: {
				servings: 2,
				ingredients: normalization.normalized,
			},
			references: [
				{
					ingredientKey: "synthetic-ingredient",
					basisGrams: 100,
					nutrition: {
						caloriesKcal: 200,
						proteinG: 20,
						carbsG: 10,
						fatG: 8,
					},
				},
				{
					ingredientKey: "synthetic-soy-sauce",
					basisGrams: 100,
					nutrition: {
						caloriesKcal: 100,
						proteinG: 0,
						carbsG: 25,
						fatG: 0,
					},
				},
			],
		});

		expect(nutrition.status).toBe("complete");
		if (nutrition.status === "complete") {
			expect(nutrition.total.caloriesKcal).toBe(340);
			expect(nutrition.perServing.caloriesKcal).toBe(170);
		}
	});
});
