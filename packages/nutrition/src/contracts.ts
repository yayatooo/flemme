import { z } from "zod";

const NonEmptyStringSchema = z.string().trim().min(1);
const NonNegativeFiniteNumberSchema = z.number().finite().nonnegative();

export const NutritionValuesSchema = z.object({
	caloriesKcal: NonNegativeFiniteNumberSchema,
	proteinG: NonNegativeFiniteNumberSchema,
	carbsG: NonNegativeFiniteNumberSchema,
	fatG: NonNegativeFiniteNumberSchema,
});

export type NutritionValues = z.infer<typeof NutritionValuesSchema>;

export const IngredientNutritionReferenceSchema = z.object({
	ingredientKey: NonEmptyStringSchema,
	basisGrams: z.literal(100),
	nutrition: NutritionValuesSchema,
});

export type IngredientNutritionReference = z.infer<
	typeof IngredientNutritionReferenceSchema
>;

export const NutritionIngredientAmountSchema = z.object({
	ingredientKey: NonEmptyStringSchema,
	name: NonEmptyStringSchema,
	grams: z.number().finite().positive(),
});

export type NutritionIngredientAmount = z.infer<
	typeof NutritionIngredientAmountSchema
>;

export const RecipeNutritionInputSchema = z.object({
	servings: z.number().finite().int().positive(),
	ingredients: z.array(NutritionIngredientAmountSchema).min(1),
});

export type RecipeNutritionInput = z.infer<typeof RecipeNutritionInputSchema>;

const NutritionReferenceCollectionSchema = z
	.array(IngredientNutritionReferenceSchema)
	.superRefine((references, context) => {
		const seenKeys = new Set<string>();

		for (const [index, reference] of references.entries()) {
			if (seenKeys.has(reference.ingredientKey)) {
				context.addIssue({
					code: "custom",
					message: "Nutrition reference ingredient keys must be unique",
					path: [index, "ingredientKey"],
				});
			}

			seenKeys.add(reference.ingredientKey);
		}
	});

export const CalculateRecipeNutritionInputSchema = z.object({
	recipe: RecipeNutritionInputSchema,
	references: NutritionReferenceCollectionSchema,
});

export type CalculateRecipeNutritionInput = z.infer<
	typeof CalculateRecipeNutritionInputSchema
>;

const RecipeNutritionResultBaseSchema = z.object({
	estimated: z.literal(true),
	servings: z.number().finite().int().positive(),
});

export const CompleteRecipeNutritionResultSchema =
	RecipeNutritionResultBaseSchema.extend({
		status: z.literal("complete"),
		total: NutritionValuesSchema,
		perServing: NutritionValuesSchema,
	});

export type CompleteRecipeNutritionResult = z.infer<
	typeof CompleteRecipeNutritionResultSchema
>;

export const PartialRecipeNutritionResultSchema =
	RecipeNutritionResultBaseSchema.extend({
		status: z.literal("partial"),
		knownNutrition: z.object({
			total: NutritionValuesSchema,
			perServing: NutritionValuesSchema,
		}),
		missingIngredientKeys: z.array(NonEmptyStringSchema).min(1),
	});

export type PartialRecipeNutritionResult = z.infer<
	typeof PartialRecipeNutritionResultSchema
>;

export const RecipeNutritionResultSchema = z.discriminatedUnion("status", [
	CompleteRecipeNutritionResultSchema,
	PartialRecipeNutritionResultSchema,
]);

export type RecipeNutritionResult = z.infer<typeof RecipeNutritionResultSchema>;
