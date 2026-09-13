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
	const {
		recipe,
		references,
		issues: inputIssues,
	} = CalculateRecipeNutritionInputSchema.parse(input);
	const referenceByIngredientKey = new Map(
		references.map((reference) => [reference.ingredientKey, reference]),
	);
	const missingIngredientKeys = new Set<string>();
	const missingReferenceIssues = new Map<
		string,
		{
			reason: "reference-missing";
			ingredientName: string;
			ingredientKey: string;
		}
	>();
	const total = { ...EMPTY_NUTRITION };
	let contributingIngredientCount = 0;

	for (const ingredient of recipe.ingredients) {
		const reference = referenceByIngredientKey.get(ingredient.ingredientKey);

		if (!reference) {
			missingIngredientKeys.add(ingredient.ingredientKey);
			if (!missingReferenceIssues.has(ingredient.ingredientKey)) {
				missingReferenceIssues.set(ingredient.ingredientKey, {
					reason: "reference-missing",
					ingredientName: ingredient.name,
					ingredientKey: ingredient.ingredientKey,
				});
			}
			continue;
		}

		contributingIngredientCount += 1;
		const scale = ingredient.grams / reference.basisGrams;
		total.caloriesKcal += reference.nutrition.caloriesKcal * scale;
		total.proteinG += reference.nutrition.proteinG * scale;
		total.carbsG += reference.nutrition.carbsG * scale;
		total.fatG += reference.nutrition.fatG * scale;
	}

	const perServing = divideNutrition(total, recipe.servings);
	const missingKeys = [...missingIngredientKeys];
	const issues = [...inputIssues, ...missingReferenceIssues.values()];

	if (contributingIngredientCount === 0) {
		return RecipeNutritionResultSchema.parse({
			status: "unavailable",
			estimated: true,
			servings: recipe.servings,
			issues,
		});
	}

	if (issues.length > 0) {
		return RecipeNutritionResultSchema.parse({
			status: "partial",
			estimated: true,
			servings: recipe.servings,
			knownNutrition: { total, perServing },
			missingIngredientKeys: missingKeys,
			issues,
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
