import type { IngredientNutritionReference } from "../contracts";
import type { IngredientUnitConversion } from "../normalization/contracts";
import {
	type ProductionNutritionReference,
	ProductionNutritionReferenceCollectionSchema,
} from "./contracts";

const VERIFIED_AT = "2026-09-13";

function source(
	fdcId: number,
	dataType: "Foundation" | "SR Legacy",
	description: string,
	publicationDate: string,
	datasetRelease: string,
	caloriesKcal: number,
) {
	return {
		provider: "usda-fooddata-central" as const,
		fdcId,
		dataType,
		description,
		publicationDate,
		datasetRelease,
		verifiedAt: VERIFIED_AT,
		sourceUrl: `https://fdc.nal.usda.gov/food-details/${fdcId}/nutrients`,
		nutrientIds: {
			caloriesKcal,
			proteinG: 1003,
			carbsG: 1005,
			fatG: 1004,
		},
	};
}

const FOUNDATION_RELEASE = "2026-04-30";
const SR_LEGACY_RELEASE = "2018-04-01";

export const PRODUCTION_NUTRITION_DATA =
	ProductionNutritionReferenceCollectionSchema.parse([
		{
			ingredientKey: "egg",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 143,
				proteinG: 12.6,
				carbsG: 0.72,
				fatG: 9.51,
			},
			source: source(
				171287,
				"SR Legacy",
				"Egg, whole, raw, fresh",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [],
		},
		{
			ingredientKey: "garlic",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 143,
				proteinG: 6.62,
				carbsG: 28.2,
				fatG: 0.38,
			},
			source: source(
				1104647,
				"Foundation",
				"Garlic, raw",
				"2020-10-30",
				FOUNDATION_RELEASE,
				1008,
			),
			portions: [],
		},
		{
			ingredientKey: "shallot",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 72,
				proteinG: 2.5,
				carbsG: 16.8,
				fatG: 0.1,
			},
			source: source(
				170499,
				"SR Legacy",
				"Shallots, raw",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [
				{
					fdcPortionId: 86767,
					unit: "tbsp",
					amount: 1,
					grams: 10,
					description: "1 tbsp chopped",
				},
			],
		},
		{
			ingredientKey: "raw-white-rice",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 370,
				proteinG: 7.04,
				carbsG: 80.3,
				fatG: 1.03,
			},
			source: source(
				2512381,
				"Foundation",
				"Rice, white, long grain, unenriched, raw",
				"2023-04-20",
				FOUNDATION_RELEASE,
				2048,
			),
			portions: [],
		},
		{
			ingredientKey: "boneless-skinless-chicken-thigh",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 149,
				proteinG: 18.6,
				carbsG: 0,
				fatG: 7.92,
			},
			source: source(
				2646171,
				"Foundation",
				"Chicken, thigh, boneless, skinless, raw",
				"2023-10-26",
				FOUNDATION_RELEASE,
				2048,
			),
			portions: [],
		},
		{
			ingredientKey: "canola-oil",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 884,
				proteinG: 0,
				carbsG: 0,
				fatG: 100,
			},
			source: source(
				172336,
				"SR Legacy",
				"Oil, canola",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [
				{
					fdcPortionId: 90376,
					unit: "tsp",
					amount: 1,
					grams: 4.5,
					description: "1 tsp",
				},
				{
					fdcPortionId: 90374,
					unit: "tbsp",
					amount: 1,
					grams: 14,
					description: "1 tbsp",
				},
			],
		},
		{
			ingredientKey: "table-salt",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 0,
				proteinG: 0,
				carbsG: 0,
				fatG: 0,
			},
			source: source(
				173468,
				"SR Legacy",
				"Salt, table",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [
				{
					fdcPortionId: 92594,
					unit: "tsp",
					amount: 1,
					grams: 6,
					description: "1 tsp",
				},
				{
					fdcPortionId: 92595,
					unit: "tbsp",
					amount: 1,
					grams: 18,
					description: "1 tbsp",
				},
			],
		},
		{
			ingredientKey: "tomato",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 18,
				proteinG: 0.88,
				carbsG: 3.89,
				fatG: 0.2,
			},
			source: source(
				170457,
				"SR Legacy",
				"Tomatoes, red, ripe, raw, year round average",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [],
		},
		{
			ingredientKey: "carrot",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 41,
				proteinG: 0.93,
				carbsG: 9.58,
				fatG: 0.24,
			},
			source: source(
				170393,
				"SR Legacy",
				"Carrots, raw",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [],
		},
		{
			ingredientKey: "potato",
			basisGrams: 100,
			nutrition: {
				caloriesKcal: 77,
				proteinG: 2.05,
				carbsG: 17.5,
				fatG: 0.09,
			},
			source: source(
				170026,
				"SR Legacy",
				"Potatoes, flesh and skin, raw",
				"2019-04-01",
				SR_LEGACY_RELEASE,
				1008,
			),
			portions: [],
		},
	] satisfies ProductionNutritionReference[]);

export const PRODUCTION_NUTRITION_REFERENCES: IngredientNutritionReference[] =
	PRODUCTION_NUTRITION_DATA.map(({ ingredientKey, basisGrams, nutrition }) => ({
		ingredientKey,
		basisGrams,
		nutrition,
	}));

export const PRODUCTION_INGREDIENT_UNIT_CONVERSIONS: IngredientUnitConversion[] =
	PRODUCTION_NUTRITION_DATA.flatMap((reference) =>
		reference.portions.map((portion) => ({
			ingredientKey: reference.ingredientKey,
			unit: portion.unit,
			gramsPerUnit: portion.grams / portion.amount,
		})),
	);
