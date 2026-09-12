import { z } from "zod";

import { normalizeIngredientName } from "./normalize-ingredient-name";

const NonEmptyStringSchema = z.string().trim().min(1);
export const IngredientKeySchema = z
	.string()
	.trim()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a kebab-case ingredient key");

export const CanonicalIngredientSchema = z.object({
	key: IngredientKeySchema,
	names: z.object({
		id: NonEmptyStringSchema,
		en: NonEmptyStringSchema,
	}),
	aliases: z.object({
		id: z.array(NonEmptyStringSchema),
		en: z.array(NonEmptyStringSchema),
	}),
});

export type CanonicalIngredient = z.infer<typeof CanonicalIngredientSchema>;

function getIngredientNames(ingredient: CanonicalIngredient) {
	return [
		ingredient.names.id,
		ingredient.names.en,
		...ingredient.aliases.id,
		...ingredient.aliases.en,
	];
}

export const IngredientCatalogInputSchema = z
	.object({
		ingredients: z.array(CanonicalIngredientSchema),
	})
	.superRefine(({ ingredients }, context) => {
		const ingredientIndexByKey = new Map<string, number>();
		const nameOwner = new Map<
			string,
			{ ingredientKey: string; index: number }
		>();

		for (const [index, ingredient] of ingredients.entries()) {
			const existingKeyIndex = ingredientIndexByKey.get(ingredient.key);

			if (existingKeyIndex !== undefined) {
				context.addIssue({
					code: "custom",
					message: `Duplicate canonical ingredient key: ${ingredient.key}`,
					path: ["ingredients", index, "key"],
				});
			}

			ingredientIndexByKey.set(ingredient.key, index);

			for (const name of getIngredientNames(ingredient)) {
				const normalizedName = normalizeIngredientName(name);
				const existingOwner = nameOwner.get(normalizedName);

				if (existingOwner && existingOwner.ingredientKey !== ingredient.key) {
					context.addIssue({
						code: "custom",
						message: `Ingredient name collision with ${existingOwner.ingredientKey}: ${name}`,
						path: ["ingredients", index],
					});
				} else {
					nameOwner.set(normalizedName, {
						ingredientKey: ingredient.key,
						index,
					});
				}
			}
		}
	});

export type IngredientCatalogInput = z.infer<
	typeof IngredientCatalogInputSchema
>;

export const ResolveIngredientInputSchema = z.object({
	query: NonEmptyStringSchema,
});

export type ResolveIngredientInput = z.infer<
	typeof ResolveIngredientInputSchema
>;

export const IngredientResolutionResultSchema = z.discriminatedUnion("status", [
	z.object({
		status: z.literal("resolved"),
		ingredient: CanonicalIngredientSchema,
	}),
	z.object({
		status: z.literal("unresolved"),
		query: NonEmptyStringSchema,
	}),
]);

export type IngredientResolutionResult = z.infer<
	typeof IngredientResolutionResultSchema
>;
