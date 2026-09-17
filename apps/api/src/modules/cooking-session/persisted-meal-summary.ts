import type { MealNutritionSummary } from "@flemme/contracts/meal-projection";
import type { RecipeNutritionResult } from "@flemme/nutrition";

export function projectMealNutritionSummary(
	nutrition: RecipeNutritionResult | null,
): MealNutritionSummary | null {
	if (!nutrition) return null;
	if (nutrition.status === "unavailable") {
		return { status: "unavailable" };
	}
	const perServing =
		nutrition.status === "complete"
			? nutrition.perServing
			: nutrition.knownNutrition.perServing;
	return {
		status: nutrition.status,
		estimated: nutrition.estimated,
		caloriesKcal: perServing.caloriesKcal,
		proteinG: perServing.proteinG,
	};
}
