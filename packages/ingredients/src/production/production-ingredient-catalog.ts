import type { CanonicalIngredient } from "../contracts";
import { createIngredientCatalog } from "../ingredient-catalog";

/**
 * Curated production identities with reviewed Indonesian and English names.
 * Nutrition-source mappings remain owned by @flemme/nutrition.
 */
export const PRODUCTION_CANONICAL_INGREDIENTS = [
	{
		key: "egg",
		names: { id: "Telur ayam", en: "Chicken egg" },
		aliases: { id: ["Telur"], en: ["Egg", "Whole egg"] },
	},
	{
		key: "garlic",
		names: { id: "Bawang putih", en: "Garlic" },
		aliases: { id: [], en: ["Raw garlic"] },
	},
	{
		key: "shallot",
		names: { id: "Bawang merah", en: "Shallot" },
		aliases: { id: [], en: ["Shallots"] },
	},
	{
		key: "raw-white-rice",
		names: { id: "Beras putih mentah", en: "Raw white rice" },
		aliases: { id: ["Beras putih", "Beras"], en: ["Uncooked white rice"] },
	},
	{
		key: "boneless-skinless-chicken-thigh",
		names: {
			id: "Paha ayam tanpa tulang dan kulit",
			en: "Boneless skinless chicken thigh",
		},
		aliases: {
			id: ["Daging paha ayam tanpa tulang dan kulit"],
			en: ["Skinless boneless chicken thigh"],
		},
	},
	{
		key: "canola-oil",
		names: { id: "Minyak kanola", en: "Canola oil" },
		aliases: { id: [], en: ["Rapeseed oil"] },
	},
	{
		key: "table-salt",
		names: { id: "Garam meja", en: "Table salt" },
		aliases: { id: ["Garam"], en: ["Salt"] },
	},
	{
		key: "tomato",
		names: { id: "Tomat", en: "Tomato" },
		aliases: { id: ["Tomat merah"], en: ["Red tomato"] },
	},
	{
		key: "carrot",
		names: { id: "Wortel", en: "Carrot" },
		aliases: { id: [], en: ["Carrots"] },
	},
	{
		key: "potato",
		names: { id: "Kentang", en: "Potato" },
		aliases: { id: [], en: ["Potatoes"] },
	},
] satisfies CanonicalIngredient[];

export const productionIngredientCatalog = createIngredientCatalog({
	ingredients: PRODUCTION_CANONICAL_INGREDIENTS,
});
