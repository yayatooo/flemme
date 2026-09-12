import { z } from "zod";

import { NutritionIngredientAmountSchema } from "../contracts";

const NonEmptyStringSchema = z.string().trim().min(1);

export const SupportedIngredientUnitSchema = z.enum([
	"g",
	"kg",
	"ml",
	"l",
	"tsp",
	"tbsp",
	"clove",
	"piece",
]);

export type SupportedIngredientUnit = z.infer<
	typeof SupportedIngredientUnitSchema
>;

export const ReferencedIngredientUnitSchema = z.enum([
	"ml",
	"l",
	"tsp",
	"tbsp",
	"clove",
	"piece",
]);

export type ReferencedIngredientUnit = z.infer<
	typeof ReferencedIngredientUnitSchema
>;

export const IngredientUnitConversionSchema = z.object({
	ingredientKey: NonEmptyStringSchema,
	unit: ReferencedIngredientUnitSchema,
	gramsPerUnit: z.number().finite().positive(),
});

export type IngredientUnitConversion = z.infer<
	typeof IngredientUnitConversionSchema
>;

export const IngredientNormalizationInputSchema = z.object({
	ingredientKey: NonEmptyStringSchema,
	name: NonEmptyStringSchema,
	quantity: z.number().finite().positive(),
	unit: SupportedIngredientUnitSchema,
});

export type IngredientNormalizationInput = z.infer<
	typeof IngredientNormalizationInputSchema
>;

const IngredientUnitConversionCollectionSchema = z
	.array(IngredientUnitConversionSchema)
	.superRefine((conversions, context) => {
		const seenConversions = new Set<string>();

		for (const [index, conversion] of conversions.entries()) {
			const conversionKey = JSON.stringify([
				conversion.ingredientKey,
				conversion.unit,
			]);

			if (seenConversions.has(conversionKey)) {
				context.addIssue({
					code: "custom",
					message: "Ingredient and unit conversion pairs must be unique",
					path: [index],
				});
			}

			seenConversions.add(conversionKey);
		}
	});

export const NormalizeIngredientInputSchema = z.object({
	ingredient: IngredientNormalizationInputSchema,
	conversions: IngredientUnitConversionCollectionSchema,
});

export type NormalizeIngredientInput = z.infer<
	typeof NormalizeIngredientInputSchema
>;

export const NormalizedIngredientResultSchema = z.object({
	status: z.literal("normalized"),
	ingredient: NutritionIngredientAmountSchema,
});

export type NormalizedIngredientResult = z.infer<
	typeof NormalizedIngredientResultSchema
>;

export const IngredientNormalizationIssueSchema =
	IngredientNormalizationInputSchema.extend({
		status: z.literal("unresolved"),
		reason: z.literal("missing-conversion"),
	});

export type IngredientNormalizationIssue = z.infer<
	typeof IngredientNormalizationIssueSchema
>;

export const IngredientNormalizationResultSchema = z.discriminatedUnion(
	"status",
	[NormalizedIngredientResultSchema, IngredientNormalizationIssueSchema],
);

export type IngredientNormalizationResult = z.infer<
	typeof IngredientNormalizationResultSchema
>;

export const NormalizeRecipeIngredientsInputSchema = z.object({
	ingredients: z.array(IngredientNormalizationInputSchema).min(1),
	conversions: IngredientUnitConversionCollectionSchema,
});

export type NormalizeRecipeIngredientsInput = z.infer<
	typeof NormalizeRecipeIngredientsInputSchema
>;

export const RecipeIngredientNormalizationResultSchema = z.object({
	normalized: z.array(NutritionIngredientAmountSchema),
	unresolved: z.array(IngredientNormalizationIssueSchema),
});

export type RecipeIngredientNormalizationResult = z.infer<
	typeof RecipeIngredientNormalizationResultSchema
>;
