import { IngredientKeySchema } from "@flemme/ingredients";
import { z } from "zod";

import {
	IngredientNutritionReferenceSchema,
	NutritionValuesSchema,
} from "../contracts";
import { ReferencedIngredientUnitSchema } from "../normalization/contracts";

const NonEmptyStringSchema = z.string().trim().min(1);
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u);

export const UsdaFoodDataTypeSchema = z.enum(["Foundation", "SR Legacy"]);

export const UsdaFoodDataProvenanceSchema = z.object({
	provider: z.literal("usda-fooddata-central"),
	fdcId: z.number().int().positive(),
	dataType: UsdaFoodDataTypeSchema,
	description: NonEmptyStringSchema,
	publicationDate: IsoDateSchema,
	datasetRelease: IsoDateSchema,
	verifiedAt: IsoDateSchema,
	sourceUrl: z.string().url(),
	nutrientIds: z.object({
		caloriesKcal: z.number().int().positive(),
		proteinG: z.number().int().positive(),
		carbsG: z.number().int().positive(),
		fatG: z.number().int().positive(),
	}),
});

export type UsdaFoodDataProvenance = z.infer<
	typeof UsdaFoodDataProvenanceSchema
>;

export const ProductionIngredientPortionSchema = z.object({
	fdcPortionId: z.number().int().positive(),
	unit: ReferencedIngredientUnitSchema,
	amount: z.number().finite().positive(),
	grams: z.number().finite().positive(),
	description: NonEmptyStringSchema,
});

export type ProductionIngredientPortion = z.infer<
	typeof ProductionIngredientPortionSchema
>;

export const ProductionNutritionReferenceSchema =
	IngredientNutritionReferenceSchema.extend({
		ingredientKey: IngredientKeySchema,
		nutrition: NutritionValuesSchema,
		source: UsdaFoodDataProvenanceSchema,
		portions: z.array(ProductionIngredientPortionSchema),
	});

export type ProductionNutritionReference = z.infer<
	typeof ProductionNutritionReferenceSchema
>;

export const ProductionNutritionReferenceCollectionSchema = z
	.array(ProductionNutritionReferenceSchema)
	.min(1)
	.superRefine((references, context) => {
		const ingredientKeys = new Set<string>();
		const fdcIds = new Set<number>();

		for (const [referenceIndex, reference] of references.entries()) {
			if (ingredientKeys.has(reference.ingredientKey)) {
				context.addIssue({
					code: "custom",
					message: "Production ingredient mappings must be unique",
					path: [referenceIndex, "ingredientKey"],
				});
			}
			ingredientKeys.add(reference.ingredientKey);

			if (fdcIds.has(reference.source.fdcId)) {
				context.addIssue({
					code: "custom",
					message: "Production FDC mappings must be unique",
					path: [referenceIndex, "source", "fdcId"],
				});
			}
			fdcIds.add(reference.source.fdcId);

			const portionUnits = new Set<string>();
			for (const [portionIndex, portion] of reference.portions.entries()) {
				if (portionUnits.has(portion.unit)) {
					context.addIssue({
						code: "custom",
						message:
							"Production portions must not define ambiguous duplicate units",
						path: [referenceIndex, "portions", portionIndex, "unit"],
					});
				}
				portionUnits.add(portion.unit);
			}
		}
	});
