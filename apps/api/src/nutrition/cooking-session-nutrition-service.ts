import type { PreCookingOutput } from "@flemme/agent";
import { productionIngredientCatalog } from "@flemme/ingredients";
import {
	calculateRecipeNutrition,
	type NutritionCoverageIssue,
	type NutritionIngredientAmount,
	normalizeIngredient,
	normalizeIngredientUnit,
	PRODUCTION_INGREDIENT_UNIT_CONVERSIONS,
	PRODUCTION_NUTRITION_REFERENCES,
	type RecipeNutritionResult,
} from "@flemme/nutrition";

interface CalculateCookingSessionNutritionInput {
	cookingPlan: PreCookingOutput;
	servings: number;
}

/**
 * Calculates nutrition from an already-restored Cooking Session snapshot.
 * Production catalog data is committed locally; this path performs no network
 * requests, AI calls, or persistence mutations.
 */
export function calculateCookingSessionNutrition({
	cookingPlan,
	servings,
}: CalculateCookingSessionNutritionInput): RecipeNutritionResult {
	const normalizedIngredients: NutritionIngredientAmount[] = [];
	const issues: NutritionCoverageIssue[] = [];

	for (const ingredient of cookingPlan.ingredients) {
		const canonicalIngredient = productionIngredientCatalog.resolveName(
			ingredient.name,
		);

		if (!canonicalIngredient) {
			issues.push({
				reason: "ingredient-unresolved",
				ingredientName: ingredient.name,
				...(ingredient.unit ? { unit: ingredient.unit } : {}),
			});
			continue;
		}

		if (ingredient.quantity === undefined) {
			issues.push({
				reason: "quantity-missing",
				ingredientName: ingredient.name,
				ingredientKey: canonicalIngredient.key,
				...(ingredient.unit ? { unit: ingredient.unit } : {}),
			});
			continue;
		}

		const normalizedUnit = ingredient.unit
			? normalizeIngredientUnit(ingredient.unit)
			: undefined;

		if (!normalizedUnit) {
			issues.push({
				reason: "unit-unsupported",
				ingredientName: ingredient.name,
				ingredientKey: canonicalIngredient.key,
				...(ingredient.unit ? { unit: ingredient.unit } : {}),
			});
			continue;
		}

		const normalization = normalizeIngredient({
			ingredient: {
				ingredientKey: canonicalIngredient.key,
				name: ingredient.name,
				quantity: ingredient.quantity,
				unit: normalizedUnit,
			},
			conversions: PRODUCTION_INGREDIENT_UNIT_CONVERSIONS,
		});

		if (normalization.status === "unresolved") {
			issues.push({
				reason: "portion-unavailable",
				ingredientName: ingredient.name,
				ingredientKey: canonicalIngredient.key,
				unit: ingredient.unit ?? normalizedUnit,
			});
			continue;
		}

		normalizedIngredients.push(normalization.ingredient);
	}

	return calculateRecipeNutrition({
		recipe: { servings, ingredients: normalizedIngredients },
		references: PRODUCTION_NUTRITION_REFERENCES,
		issues,
	});
}
