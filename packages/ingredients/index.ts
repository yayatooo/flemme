export {
	type CanonicalIngredient,
	CanonicalIngredientSchema,
	type IngredientCatalogInput,
	IngredientCatalogInputSchema,
	IngredientKeySchema,
	type IngredientResolutionResult,
	IngredientResolutionResultSchema,
	type ResolveIngredientInput,
	ResolveIngredientInputSchema,
} from "./src/contracts";
export {
	createIngredientCatalog,
	getIngredientByKey,
	type IngredientCatalog,
	resolveIngredient,
} from "./src/ingredient-catalog";
export { normalizeIngredientName } from "./src/normalize-ingredient-name";
export {
	PRODUCTION_CANONICAL_INGREDIENTS,
	productionIngredientCatalog,
} from "./src/production/production-ingredient-catalog";
