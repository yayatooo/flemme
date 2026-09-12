import {
	type NormalizeRecipeIngredientsInput,
	NormalizeRecipeIngredientsInputSchema,
	type RecipeIngredientNormalizationResult,
	RecipeIngredientNormalizationResultSchema,
} from "./contracts";
import { normalizeIngredient } from "./normalize-ingredient";

export function normalizeRecipeIngredients(
	input: NormalizeRecipeIngredientsInput,
): RecipeIngredientNormalizationResult {
	const { ingredients, conversions } =
		NormalizeRecipeIngredientsInputSchema.parse(input);
	const normalized: RecipeIngredientNormalizationResult["normalized"] = [];
	const unresolved: RecipeIngredientNormalizationResult["unresolved"] = [];

	for (const ingredient of ingredients) {
		const result = normalizeIngredient({ ingredient, conversions });

		if (result.status === "normalized") {
			normalized.push(result.ingredient);
		} else {
			unresolved.push(result);
		}
	}

	return RecipeIngredientNormalizationResultSchema.parse({
		normalized,
		unresolved,
	});
}
