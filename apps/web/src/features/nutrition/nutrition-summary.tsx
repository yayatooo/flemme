import type {
	NutritionValues,
	RecipeNutritionResult,
} from "@flemme/nutrition/recipe-nutrition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NutritionSummaryProps {
	nutrition: RecipeNutritionResult;
}

const decimalFormatter = new Intl.NumberFormat("en", {
	maximumFractionDigits: 1,
});
const calorieFormatter = new Intl.NumberFormat("en", {
	maximumFractionDigits: 0,
});

function perServingValues(
	nutrition: RecipeNutritionResult,
): NutritionValues | null {
	if (nutrition.status === "complete") return nutrition.perServing;
	if (nutrition.status === "partial") {
		return nutrition.knownNutrition.perServing;
	}
	return null;
}

export function NutritionSummary({ nutrition }: NutritionSummaryProps) {
	const values = perServingValues(nutrition);
	if (!values) {
		return (
			<Card className="border-transparent shadow-card">
				<CardHeader>
					<CardTitle>Not enough data for an estimate</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="leading-relaxed text-muted-foreground">
						We don't have enough quantity or reference data to estimate this
						meal yet.
					</p>
					<p className="text-sm font-bold">
						No zero values are shown for ingredients Flemme could not calculate.
					</p>
				</CardContent>
			</Card>
		);
	}

	const approximate = nutrition.status === "partial" ? "~" : "";
	return (
		<Card className="overflow-hidden border-transparent shadow-card">
			<CardHeader className="mx-5 rounded-2xl bg-forest p-4 text-card sm:mx-6">
				<CardTitle className="text-2xl text-card!">
					Estimated nutrition
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6 pt-1">
				<div>
					<p className="font-heading text-5xl leading-none tracking-tight sm:text-6xl">
						{approximate}
						{calorieFormatter.format(values.caloriesKcal)}
						<span className="ml-2 text-xl">kcal</span>
					</p>
					<p className="mt-2 text-sm font-extrabold text-muted-foreground">
						Per serving
					</p>
				</div>
				<dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
					{(
						[
							["Protein", values.proteinG],
							["Carbs", values.carbsG],
							["Fat", values.fatG],
						] as const
					).map(([label, value]) => (
						<div key={label} className="min-w-0 rounded-2xl bg-muted/50 p-3">
							<dt className="text-xs font-bold text-muted-foreground">
								{label}
							</dt>
							<dd className="mt-1 font-heading text-xl sm:text-2xl">
								{approximate}
								{decimalFormatter.format(value)} g
							</dd>
						</div>
					))}
				</dl>
				<p className="text-sm font-bold">
					Based on {nutrition.servings}{" "}
					{nutrition.servings === 1 ? "serving" : "servings"}.
				</p>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{nutrition.status === "partial"
						? "Some ingredients or recorded changes could not be included, so the actual values may be higher or lower."
						: "Estimated from the ingredient amounts Flemme could calculate."}
				</p>
			</CardContent>
		</Card>
	);
}
