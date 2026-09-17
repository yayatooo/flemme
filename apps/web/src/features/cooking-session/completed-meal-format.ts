import type { MealNutritionSummary } from "@flemme/contracts/meal-projection";

const completedAtFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});
const nutritionNumberFormatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 0,
});

export function formatCompletedMealDate(completedAt: string) {
	return completedAtFormatter.format(new Date(completedAt));
}

export function completedMealNutritionLabel(
	nutrition: MealNutritionSummary | null,
) {
	if (!nutrition) return null;
	if (nutrition.status === "unavailable") {
		return "Nutrition unavailable";
	}
	const macros = `~${nutritionNumberFormatter.format(nutrition.caloriesKcal)} kcal · ${nutritionNumberFormatter.format(nutrition.proteinG)}g protein`;
	return nutrition.status === "partial" ? `Partial · ${macros}` : macros;
}
