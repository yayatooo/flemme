import { describe, expect, test } from "bun:test";

import { calculateRecipeNutrition } from "./calculate-recipe-nutrition";
import type {
	IngredientNutritionReference,
	NutritionValues,
} from "./contracts";

// Synthetic values exist only to make calculator arithmetic easy to verify.
function createReference(
	ingredientKey: string,
	nutrition: NutritionValues,
): IngredientNutritionReference {
	return { ingredientKey, basisGrams: 100, nutrition };
}

const PRIMARY_REFERENCE = createReference("synthetic-primary", {
	caloriesKcal: 200,
	proteinG: 20,
	carbsG: 10,
	fatG: 8,
});

describe("calculateRecipeNutrition", () => {
	test("scales a single ingredient from its 100 gram reference", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 1,
				ingredients: [
					{
						ingredientKey: "synthetic-primary",
						name: "Synthetic primary ingredient",
						grams: 150,
					},
				],
			},
			references: [PRIMARY_REFERENCE],
		});

		expect(result).toEqual({
			status: "complete",
			estimated: true,
			servings: 1,
			total: { caloriesKcal: 300, proteinG: 30, carbsG: 15, fatG: 12 },
			perServing: {
				caloriesKcal: 300,
				proteinG: 30,
				carbsG: 15,
				fatG: 12,
			},
		});
	});

	test("sums multiple known ingredients", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 1,
				ingredients: [
					{
						ingredientKey: "synthetic-primary",
						name: "Primary",
						grams: 100,
					},
					{
						ingredientKey: "synthetic-secondary",
						name: "Secondary",
						grams: 50,
					},
				],
			},
			references: [
				PRIMARY_REFERENCE,
				createReference("synthetic-secondary", {
					caloriesKcal: 100,
					proteinG: 4,
					carbsG: 20,
					fatG: 2,
				}),
			],
		});

		expect(result.status).toBe("complete");
		if (result.status === "complete") {
			expect(result.total).toEqual({
				caloriesKcal: 250,
				proteinG: 22,
				carbsG: 20,
				fatG: 9,
			});
		}
	});

	test("calculates total first and divides it by servings", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 2,
				ingredients: [
					{
						ingredientKey: "synthetic-meal",
						name: "Synthetic meal",
						grams: 200,
					},
				],
			},
			references: [
				createReference("synthetic-meal", {
					caloriesKcal: 600,
					proteinG: 40,
					carbsG: 50,
					fatG: 20,
				}),
			],
		});

		expect(result.status).toBe("complete");
		if (result.status === "complete") {
			expect(result.total.caloriesKcal).toBe(1200);
			expect(result.perServing).toEqual({
				caloriesKcal: 600,
				proteinG: 40,
				carbsG: 50,
				fatG: 20,
			});
		}
	});

	test("scales a fractional 25 gram quantity", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 1,
				ingredients: [
					{
						ingredientKey: "synthetic-primary",
						name: "Primary",
						grams: 25,
					},
				],
			},
			references: [PRIMARY_REFERENCE],
		});

		expect(result.status).toBe("complete");
		if (result.status === "complete") {
			expect(result.total).toEqual({
				caloriesKcal: 50,
				proteinG: 5,
				carbsG: 2.5,
				fatG: 2,
			});
		}
	});

	test("counts duplicate ingredient entries independently", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 1,
				ingredients: [
					{ ingredientKey: "synthetic-oil", name: "Oil", grams: 10 },
					{ ingredientKey: "synthetic-oil", name: "Oil", grams: 5 },
				],
			},
			references: [
				createReference("synthetic-oil", {
					caloriesKcal: 1_000,
					proteinG: 0,
					carbsG: 0,
					fatG: 100,
				}),
			],
		});

		expect(result.status).toBe("complete");
		if (result.status === "complete") {
			expect(result.total.caloriesKcal).toBe(150);
			expect(result.total.fatG).toBe(15);
		}
	});

	test("returns known nutrition separately when a reference is missing", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 2,
				ingredients: [
					{
						ingredientKey: "synthetic-primary",
						name: "Primary",
						grams: 100,
					},
					{
						ingredientKey: "unknown-sauce",
						name: "Unknown sauce",
						grams: 20,
					},
				],
			},
			references: [PRIMARY_REFERENCE],
		});

		expect(result).toEqual({
			status: "partial",
			estimated: true,
			servings: 2,
			knownNutrition: {
				total: { caloriesKcal: 200, proteinG: 20, carbsG: 10, fatG: 8 },
				perServing: {
					caloriesKcal: 100,
					proteinG: 10,
					carbsG: 5,
					fatG: 4,
				},
			},
			missingIngredientKeys: ["unknown-sauce"],
		});
	});

	test("returns multiple missing keys once in first-seen order", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 1,
				ingredients: [
					{ ingredientKey: "missing-a", name: "Missing A", grams: 10 },
					{ ingredientKey: "missing-b", name: "Missing B", grams: 20 },
					{ ingredientKey: "missing-a", name: "Missing A", grams: 5 },
				],
			},
			references: [],
		});

		expect(result.status).toBe("partial");
		if (result.status === "partial") {
			expect(result.missingIngredientKeys).toEqual(["missing-a", "missing-b"]);
			expect(result.knownNutrition.total).toEqual({
				caloriesKcal: 0,
				proteinG: 0,
				carbsG: 0,
				fatG: 0,
			});
		}
	});

	test.each([0, -1])("rejects %i servings", (servings) => {
		expect(() =>
			calculateRecipeNutrition({
				recipe: {
					servings,
					ingredients: [
						{
							ingredientKey: "synthetic-primary",
							name: "Primary",
							grams: 100,
						},
					],
				},
				references: [PRIMARY_REFERENCE],
			} as never),
		).toThrow();
	});

	test.each([0, -1])("rejects a %i gram ingredient amount", (grams) => {
		expect(() =>
			calculateRecipeNutrition({
				recipe: {
					servings: 1,
					ingredients: [
						{
							ingredientKey: "synthetic-primary",
							name: "Primary",
							grams,
						},
					],
				},
				references: [PRIMARY_REFERENCE],
			} as never),
		).toThrow();
	});

	test("rejects a negative nutrition reference value", () => {
		expect(() =>
			calculateRecipeNutrition({
				recipe: {
					servings: 1,
					ingredients: [
						{
							ingredientKey: "invalid-reference",
							name: "Invalid",
							grams: 100,
						},
					],
				},
				references: [
					createReference("invalid-reference", {
						caloriesKcal: -1,
						proteinG: 0,
						carbsG: 0,
						fatG: 0,
					}),
				],
			} as never),
		).toThrow();
	});

	test("rejects an empty ingredient list", () => {
		expect(() =>
			calculateRecipeNutrition({
				recipe: { servings: 1, ingredients: [] },
				references: [],
			} as never),
		).toThrow();
	});

	test("rejects duplicate nutrition reference keys", () => {
		expect(() =>
			calculateRecipeNutrition({
				recipe: {
					servings: 1,
					ingredients: [
						{
							ingredientKey: "synthetic-primary",
							name: "Primary",
							grams: 100,
						},
					],
				},
				references: [PRIMARY_REFERENCE, PRIMARY_REFERENCE],
			} as never),
		).toThrow();
	});

	test("preserves decimal arithmetic without calculator rounding", () => {
		const result = calculateRecipeNutrition({
			recipe: {
				servings: 3,
				ingredients: [
					{
						ingredientKey: "synthetic-decimal",
						name: "Decimal fixture",
						grams: 33.3,
					},
				],
			},
			references: [
				createReference("synthetic-decimal", {
					caloriesKcal: 123.456,
					proteinG: 7.891,
					carbsG: 11.1213,
					fatG: 4.567,
				}),
			],
		});

		expect(result.status).toBe("complete");
		if (result.status === "complete") {
			expect(result.total.caloriesKcal).toBeCloseTo(41.110848, 10);
			expect(result.perServing.proteinG).toBeCloseTo(0.875901, 10);
		}
	});
});
