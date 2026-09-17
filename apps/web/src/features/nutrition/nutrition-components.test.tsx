import { expect, test } from "bun:test";
import type { RecipeNutritionResult } from "@flemme/nutrition/recipe-nutrition";
import { renderToStaticMarkup } from "react-dom/server";
import { NutritionCoverage } from "./nutrition-coverage";
import { NutritionLoading } from "./nutrition-loading";
import { NutritionSummary } from "./nutrition-summary";

const completeNutrition = {
	status: "complete",
	estimated: true,
	servings: 2,
	includedIngredients: [
		{ ingredientKey: "tomato", name: "Tomato", grams: 200 },
		{ ingredientKey: "canola-oil", name: "Canola oil", grams: 14 },
	],
	total: { caloriesKcal: 159.76, proteinG: 1.76, carbsG: 7.78, fatG: 14.4 },
	perServing: {
		caloriesKcal: 79.88,
		proteinG: 0.88,
		carbsG: 3.89,
		fatG: 7.2,
	},
} satisfies RecipeNutritionResult;

const partialNutrition = {
	status: "partial",
	estimated: true,
	servings: 2,
	includedIngredients: [
		{ ingredientKey: "tomato", name: "Tomato", grams: 200 },
	],
	knownNutrition: {
		total: { caloriesKcal: 36, proteinG: 1.76, carbsG: 7.78, fatG: 0.4 },
		perServing: {
			caloriesKcal: 18,
			proteinG: 0.88,
			carbsG: 3.89,
			fatG: 0.2,
		},
	},
	missingIngredientKeys: [],
	issues: [
		{
			reason: "quantity-missing",
			ingredientName: "Garlic",
			ingredientKey: "garlic",
		},
		{
			reason: "unquantified-change",
			changeDescription: "Used less tomato.",
		},
	],
} satisfies RecipeNutritionResult;

const unavailableNutrition = {
	status: "unavailable",
	estimated: true,
	servings: 2,
	includedIngredients: [],
	issues: [
		{
			reason: "ingredient-unresolved",
			ingredientName: "Mystery sauce",
		},
	],
} satisfies RecipeNutritionResult;

const plannedIngredients = [
	{ name: "Tomato", quantity: 200, unit: "g" },
	{ name: "Garlic" },
];

test("complete Nutrition emphasizes per-serving calories and all primary macros", () => {
	const markup = renderToStaticMarkup(
		<NutritionSummary nutrition={completeNutrition} />,
	);

	expect(markup).toContain("80");
	expect(markup).toContain("kcal");
	expect(markup).toContain("Per serving");
	expect(markup).toContain("Protein");
	expect(markup).toContain("Carbs");
	expect(markup).toContain("Fat");
	expect(markup).toContain("Based on 2 servings");
});

test("partial Nutrition marks values approximate and explains incomplete coverage", () => {
	const summary = renderToStaticMarkup(
		<NutritionSummary nutrition={partialNutrition} />,
	);
	const coverage = renderToStaticMarkup(
		<NutritionCoverage
			nutrition={partialNutrition}
			plannedIngredients={plannedIngredients}
		/>,
	);

	expect(summary).toContain("~18");
	expect(summary).toContain("actual values may be higher or lower");
	expect(coverage).toContain("Partial estimate");
	expect(coverage).toContain("Calculated from 1 of 2 planned ingredients");
	expect(coverage).toContain("1 recorded change");
	expect(coverage).toContain("See calculation details");
	expect(coverage).toContain('aria-expanded="false"');
});

test("unavailable Nutrition states the limitation without fake zero macros", () => {
	const summary = renderToStaticMarkup(
		<NutritionSummary nutrition={unavailableNutrition} />,
	);
	const coverage = renderToStaticMarkup(
		<NutritionCoverage
			nutrition={unavailableNutrition}
			plannedIngredients={[{ name: "Mystery sauce" }]}
		/>,
	);

	expect(summary).toContain("Not enough data for an estimate");
	expect(summary).not.toContain("0 kcal");
	expect(summary).not.toContain("Protein");
	expect(coverage).toContain("Not enough data");
});

test("Nutrition loading announces calculation without fake progress", () => {
	const markup = renderToStaticMarkup(
		<NutritionLoading displayName="Tomato night" />,
	);

	expect(markup).toContain("Tomato night");
	expect(markup).toContain("Calculating your meal");
	expect(markup).not.toContain("%");
});
