import {
	type CalculateRecipeNutritionInput,
	CalculateRecipeNutritionInputSchema,
	type NutritionValues,
	type RecipeNutritionResult,
	RecipeNutritionResultSchema,
} from "./contracts";

const EMPTY_NUTRITION: NutritionValues = {
	caloriesKcal: 0,
	proteinG: 0,
	carbsG: 0,
	fatG: 0,
};

function divideNutrition(
	nutrition: NutritionValues,
	divisor: number,
): NutritionValues {
	return {
		caloriesKcal: nutrition.caloriesKcal / divisor,
		proteinG: nutrition.proteinG / divisor,
		carbsG: nutrition.carbsG / divisor,
		fatG: nutrition.fatG / divisor,
	};
}

/**
 * Calculates an estimate from normalized gram amounts and per-100-gram
 * references. Partial totals include known ingredients only.
 */
export function calculateRecipeNutrition(
	input: CalculateRecipeNutritionInput,
): RecipeNutritionResult {
	const { recipe, references } =
		CalculateRecipeNutritionInputSchema.parse(input);
	const referenceByIngredientKey = new Map(
		references.map((reference) => [reference.ingredientKey, reference]),
	);
	const missingIngredientKeys = new Set<string>();
	const total = { ...EMPTY_NUTRITION };

	for (const ingredient of recipe.ingredients) {
		const reference = referenceByIngredientKey.get(ingredient.ingredientKey);

		if (!reference) {
			missingIngredientKeys.add(ingredient.ingredientKey);
			continue;
		}

		const scale = ingredient.grams / reference.basisGrams;
		total.caloriesKcal += reference.nutrition.caloriesKcal * scale;
		total.proteinG += reference.nutrition.proteinG * scale;
		total.carbsG += reference.nutrition.carbsG * scale;
		total.fatG += reference.nutrition.fatG * scale;
	}

	const perServing = divideNutrition(total, recipe.servings);
	const missingKeys = [...missingIngredientKeys];

	if (missingKeys.length > 0) {
		return RecipeNutritionResultSchema.parse({
			status: "partial",
			estimated: true,
			servings: recipe.servings,
			knownNutrition: { total, perServing },
			missingIngredientKeys: missingKeys,
		});
	}

	return RecipeNutritionResultSchema.parse({
		status: "complete",
		estimated: true,
		servings: recipe.servings,
		total,
		perServing,
	});
}
