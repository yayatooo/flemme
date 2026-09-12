import { describe, expect, test } from "bun:test";
import {
	createIngredientCatalog,
	resolveIngredient,
} from "@flemme/ingredients";

import { calculateRecipeNutrition } from "./calculate-recipe-nutrition";
import type { IngredientNutritionReference } from "./contracts";
import type { IngredientUnitConversion } from "./normalization/contracts";
import { normalizeIngredient } from "./normalization/normalize-ingredient";
import { validateIngredientReferenceIntegrity } from "./validate-ingredient-reference-integrity";

const catalog = createIngredientCatalog({
	ingredients: [
		{
			key: "sweet-soy-sauce",
			names: { id: "Kecap manis", en: "Sweet soy sauce" },
			aliases: {
				id: ["Kecap manis kental"],
				en: ["Indonesian sweet soy sauce"],
			},
		},
	],
});

// Synthetic values prove canonical-key linkage and arithmetic only.
const nutritionReferences: IngredientNutritionReference[] = [
	{
		ingredientKey: "sweet-soy-sauce",
		basisGrams: 100,
		nutrition: {
			caloriesKcal: 250,
			proteinG: 5,
			carbsG: 55,
			fatG: 1,
		},
	},
];

const unitConversions: IngredientUnitConversion[] = [
	{
		ingredientKey: "sweet-soy-sauce",
		unit: "tbsp",
		gramsPerUnit: 20,
	},
];

describe("canonical ingredient nutrition relationships", () => {
	test("accepts references to known canonical ingredients", () => {
		expect(
			validateIngredientReferenceIntegrity({
				catalog,
				nutritionReferences,
				unitConversions,
			}),
		).toEqual({ status: "valid" });
	});

	test("reports unknown nutrition and conversion reference keys", () => {
		const result = validateIngredientReferenceIntegrity({
			catalog,
			nutritionReferences: [
				...nutritionReferences,
				{
					ingredientKey: "dragon-sauce",
					basisGrams: 100,
					nutrition: {
						caloriesKcal: 1,
						proteinG: 1,
						carbsG: 1,
						fatG: 1,
					},
				},
			],
			unitConversions: [
				...unitConversions,
				{
					ingredientKey: "mystery-oil",
					unit: "tbsp",
					gramsPerUnit: 1,
				},
			],
		});

		expect(result).toEqual({
			status: "invalid",
			unknownNutritionIngredientKeys: ["dragon-sauce"],
			unknownConversionIngredientKeys: ["mystery-oil"],
		});
	});

	test("resolves, normalizes, and calculates through one canonical key", () => {
		const resolution = resolveIngredient({
			query: "  KECAP   MANIS ",
			catalog,
		});

		expect(resolution.status).toBe("resolved");
		if (resolution.status !== "resolved") {
			throw new Error("Expected the fixture ingredient to resolve");
		}

		const normalization = normalizeIngredient({
			ingredient: {
				ingredientKey: resolution.ingredient.key,
				name: resolution.ingredient.names.id,
				quantity: 2,
				unit: "tbsp",
			},
			conversions: unitConversions,
		});

		expect(normalization.status).toBe("normalized");
		if (normalization.status !== "normalized") {
			throw new Error("Expected the fixture quantity to normalize");
		}
		expect(normalization.ingredient).toEqual({
			ingredientKey: "sweet-soy-sauce",
			name: "Kecap manis",
			grams: 40,
		});

		const nutrition = calculateRecipeNutrition({
			recipe: {
				servings: 2,
				ingredients: [normalization.ingredient],
			},
			references: nutritionReferences,
		});

		expect(nutrition.status).toBe("complete");
		if (nutrition.status === "complete") {
			expect(nutrition.total).toEqual({
				caloriesKcal: 100,
				proteinG: 2,
				carbsG: 22,
				fatG: 0.4,
			});
			expect(nutrition.perServing.caloriesKcal).toBe(50);
		}
	});
});
