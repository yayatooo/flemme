import type { CanonicalIngredient } from "../contracts";
import { createIngredientCatalog } from "../ingredient-catalog";

/** Small identity-only fixture. It is not a production ingredient dataset. */
export const TEST_CANONICAL_INGREDIENTS: CanonicalIngredient[] = [
	{
		key: "chicken-thigh",
		names: { id: "Ayam paha", en: "Chicken thigh" },
		aliases: { id: ["Paha ayam"], en: ["Chicken thighs"] },
	},
	{
		key: "sweet-soy-sauce",
		names: { id: "Kecap manis", en: "Sweet soy sauce" },
		aliases: {
			id: ["Kecap manis kental"],
			en: ["Indonesian sweet soy sauce"],
		},
	},
	{
		key: "garlic",
		names: { id: "Bawang putih", en: "Garlic" },
		aliases: { id: [], en: ["Garlic clove"] },
	},
	{
		key: "shallot",
		names: { id: "Bawang merah", en: "Shallot" },
		aliases: { id: [], en: ["Shallots"] },
	},
	{
		key: "cooking-oil",
		names: { id: "Minyak goreng", en: "Cooking oil" },
		aliases: { id: ["Minyak masak"], en: [] },
	},
	{
		key: "salt",
		names: { id: "Garam", en: "Salt" },
		aliases: { id: [], en: [] },
	},
];

export const TEST_INGREDIENT_CATALOG = createIngredientCatalog({
	ingredients: TEST_CANONICAL_INGREDIENTS,
});
