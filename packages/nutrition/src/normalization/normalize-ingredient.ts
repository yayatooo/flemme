import {
	type IngredientNormalizationInput,
	type IngredientNormalizationResult,
	IngredientNormalizationResultSchema,
	type IngredientUnitConversion,
	type NormalizeIngredientInput,
	NormalizeIngredientInputSchema,
} from "./contracts";

function createUnresolvedResult(
	ingredient: IngredientNormalizationInput,
): IngredientNormalizationResult {
	return IngredientNormalizationResultSchema.parse({
		status: "unresolved",
		...ingredient,
		reason: "missing-conversion",
	});
}

function findConversion(
	ingredient: IngredientNormalizationInput,
	conversions: IngredientUnitConversion[],
) {
	return conversions.find(
		(conversion) =>
			conversion.ingredientKey === ingredient.ingredientKey &&
			conversion.unit === ingredient.unit,
	);
}

export function normalizeIngredient(
	input: NormalizeIngredientInput,
): IngredientNormalizationResult {
	const { ingredient, conversions } =
		NormalizeIngredientInputSchema.parse(input);
	let grams: number;

	if (ingredient.unit === "g") {
		grams = ingredient.quantity;
	} else if (ingredient.unit === "kg") {
		grams = ingredient.quantity * 1_000;
	} else {
		const conversion = findConversion(ingredient, conversions);

		if (!conversion) {
			return createUnresolvedResult(ingredient);
		}

		grams = ingredient.quantity * conversion.gramsPerUnit;
	}

	return IngredientNormalizationResultSchema.parse({
		status: "normalized",
		ingredient: {
			ingredientKey: ingredient.ingredientKey,
			name: ingredient.name,
			grams,
		},
	});
}
