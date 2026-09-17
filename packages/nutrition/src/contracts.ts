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

const IngredientNutritionCoverageIssueReasonSchema = z.enum([
	"ingredient-unresolved",
	"reference-missing",
	"quantity-missing",
	"unit-unsupported",
	"portion-unavailable",
]);

export const NutritionCoverageIssueReasonSchema = z.enum([
	...IngredientNutritionCoverageIssueReasonSchema.options,
	"unquantified-change",
]);

export type NutritionCoverageIssueReason = z.infer<
	typeof NutritionCoverageIssueReasonSchema
>;

const IngredientNutritionCoverageIssueSchema = z.object({
	reason: IngredientNutritionCoverageIssueReasonSchema,
	ingredientName: NonEmptyStringSchema,
	ingredientKey: NonEmptyStringSchema.optional(),
	unit: NonEmptyStringSchema.optional(),
});

const UnquantifiedNutritionChangeIssueSchema = z.object({
	reason: z.literal("unquantified-change"),
	changeDescription: NonEmptyStringSchema,
});

export const NutritionCoverageIssueSchema = z.discriminatedUnion("reason", [
	IngredientNutritionCoverageIssueSchema,
	UnquantifiedNutritionChangeIssueSchema,
]);

export type NutritionCoverageIssue = z.infer<
	typeof NutritionCoverageIssueSchema
>;

export const CalculateRecipeNutritionInputSchema = z
	.object({
		recipe: RecipeNutritionInputSchema.extend({
			ingredients: z.array(NutritionIngredientAmountSchema),
		}),
		references: NutritionReferenceCollectionSchema,
		issues: z.array(NutritionCoverageIssueSchema).default([]),
	})
	.superRefine(({ recipe, issues }, context) => {
		if (recipe.ingredients.length === 0 && issues.length === 0) {
			context.addIssue({
				code: "custom",
				message:
					"Nutrition calculation requires an ingredient or coverage issue",
				path: ["recipe", "ingredients"],
			});
		}
	});

export type CalculateRecipeNutritionInput = z.input<
	typeof CalculateRecipeNutritionInputSchema
>;

const RecipeNutritionResultBaseSchema = z.object({
	estimated: z.literal(true),
	servings: z.number().finite().int().positive(),
	// Optional only so persisted pre-Phase 7 snapshots remain readable.
	includedIngredients: z.array(NutritionIngredientAmountSchema).optional(),
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
		missingIngredientKeys: z.array(NonEmptyStringSchema),
		issues: z.array(NutritionCoverageIssueSchema).min(1).optional(),
	}).superRefine(({ missingIngredientKeys, issues }, context) => {
		if (missingIngredientKeys.length === 0 && !issues) {
			context.addIssue({
				code: "custom",
				message: "Partial nutrition requires an unresolved coverage reason",
				path: ["issues"],
			});
		}
	});

export type PartialRecipeNutritionResult = z.infer<
	typeof PartialRecipeNutritionResultSchema
>;

export const UnavailableRecipeNutritionResultSchema =
	RecipeNutritionResultBaseSchema.extend({
		status: z.literal("unavailable"),
		issues: z.array(NutritionCoverageIssueSchema).min(1),
	});

export type UnavailableRecipeNutritionResult = z.infer<
	typeof UnavailableRecipeNutritionResultSchema
>;

export const RecipeNutritionResultSchema = z.discriminatedUnion("status", [
	CompleteRecipeNutritionResultSchema,
	PartialRecipeNutritionResultSchema,
	UnavailableRecipeNutritionResultSchema,
]);

export type RecipeNutritionResult = z.infer<typeof RecipeNutritionResultSchema>;
