export function normalizeIngredientName(value: string) {
	return value.trim().replace(/\s+/gu, " ").toLowerCase();
}
