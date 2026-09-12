import {
	type CanonicalIngredient,
	type IngredientCatalogInput,
	IngredientCatalogInputSchema,
	type IngredientResolutionResult,
	IngredientResolutionResultSchema,
	type ResolveIngredientInput,
	ResolveIngredientInputSchema,
} from "./contracts";
import { normalizeIngredientName } from "./normalize-ingredient-name";

export interface IngredientCatalog {
	readonly ingredients: readonly CanonicalIngredient[];
	getByKey(key: string): CanonicalIngredient | undefined;
	resolveName(query: string): CanonicalIngredient | undefined;
}

function getIngredientNames(ingredient: CanonicalIngredient) {
	return [
		ingredient.names.id,
		ingredient.names.en,
		...ingredient.aliases.id,
		...ingredient.aliases.en,
	];
}

export function createIngredientCatalog(
	input: IngredientCatalogInput,
): IngredientCatalog {
	const { ingredients } = IngredientCatalogInputSchema.parse(input);
	const ingredientByKey = new Map(
		ingredients.map((ingredient) => [ingredient.key, ingredient]),
	);
	const ingredientByName = new Map<string, CanonicalIngredient>();

	for (const ingredient of ingredients) {
		for (const name of getIngredientNames(ingredient)) {
			ingredientByName.set(normalizeIngredientName(name), ingredient);
		}
	}

	return {
		ingredients,
		getByKey: (key) => ingredientByKey.get(key),
		resolveName: (query) =>
			ingredientByName.get(normalizeIngredientName(query)),
	};
}

export function getIngredientByKey(
	catalog: IngredientCatalog,
	key: string,
): CanonicalIngredient | undefined {
	return catalog.getByKey(key);
}

export function resolveIngredient({
	query,
	catalog,
}: ResolveIngredientInput & {
	catalog: IngredientCatalog;
}): IngredientResolutionResult {
	const validatedInput = ResolveIngredientInputSchema.parse({ query });
	const ingredient = catalog.resolveName(validatedInput.query);

	if (!ingredient) {
		return IngredientResolutionResultSchema.parse({
			status: "unresolved",
			query: validatedInput.query,
		});
	}

	return IngredientResolutionResultSchema.parse({
		status: "resolved",
		ingredient,
	});
}
