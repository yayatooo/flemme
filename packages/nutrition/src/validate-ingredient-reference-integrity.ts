import type { IngredientCatalog } from "@flemme/ingredients";
import { z } from "zod";

import {
	type IngredientNutritionReference,
	IngredientNutritionReferenceSchema,
} from "./contracts";
import {
	type IngredientUnitConversion,
	IngredientUnitConversionSchema,
} from "./normalization/contracts";

export interface IngredientReferenceIntegrityInput {
	catalog: IngredientCatalog;
	nutritionReferences: IngredientNutritionReference[];
	unitConversions: IngredientUnitConversion[];
}

export const IngredientReferenceIntegrityResultSchema = z.discriminatedUnion(
	"status",
	[
		z.object({ status: z.literal("valid") }),
		z.object({
			status: z.literal("invalid"),
			unknownNutritionIngredientKeys: z.array(z.string().min(1)),
			unknownConversionIngredientKeys: z.array(z.string().min(1)),
		}),
	],
);

export type IngredientReferenceIntegrityResult = z.infer<
	typeof IngredientReferenceIntegrityResultSchema
>;

function findUnknownKeys(
	catalog: IngredientCatalog,
	references: Array<{ ingredientKey: string }>,
) {
	return [
		...new Set(
			references
				.filter(({ ingredientKey }) => !catalog.getByKey(ingredientKey))
				.map(({ ingredientKey }) => ingredientKey),
		),
	];
}

export function validateIngredientReferenceIntegrity({
	catalog,
	nutritionReferences,
	unitConversions,
}: IngredientReferenceIntegrityInput): IngredientReferenceIntegrityResult {
	const validatedNutritionReferences = z
		.array(IngredientNutritionReferenceSchema)
		.parse(nutritionReferences);
	const validatedUnitConversions = z
		.array(IngredientUnitConversionSchema)
		.parse(unitConversions);
	const unknownNutritionIngredientKeys = findUnknownKeys(
		catalog,
		validatedNutritionReferences,
	);
	const unknownConversionIngredientKeys = findUnknownKeys(
		catalog,
		validatedUnitConversions,
	);

	if (
		unknownNutritionIngredientKeys.length === 0 &&
		unknownConversionIngredientKeys.length === 0
	) {
		return { status: "valid" };
	}

	return IngredientReferenceIntegrityResultSchema.parse({
		status: "invalid",
		unknownNutritionIngredientKeys,
		unknownConversionIngredientKeys,
	});
}
