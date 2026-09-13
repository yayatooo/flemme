import type { SupportedIngredientUnit } from "./contracts";

const UNIT_ALIASES: Readonly<Record<string, SupportedIngredientUnit>> = {
	g: "g",
	gram: "g",
	grams: "g",
	kg: "kg",
	kilogram: "kg",
	kilograms: "kg",
	ml: "ml",
	mililiter: "ml",
	milliliter: "ml",
	l: "l",
	liter: "l",
	litre: "l",
	tsp: "tsp",
	sdt: "tsp",
	"sendok teh": "tsp",
	tbsp: "tbsp",
	sdm: "tbsp",
	"sendok makan": "tbsp",
	clove: "clove",
	cloves: "clove",
	siung: "clove",
	piece: "piece",
	pieces: "piece",
	butir: "piece",
};

/** Recognizes exact unit names only; recognition does not imply a mass conversion. */
export function normalizeIngredientUnit(
	unit: string,
): SupportedIngredientUnit | undefined {
	return UNIT_ALIASES[unit.trim().replace(/\s+/gu, " ").toLowerCase()];
}
