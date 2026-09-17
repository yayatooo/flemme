import type {
	NutritionCoverageIssue,
	RecipeNutritionResult,
} from "@flemme/nutrition/recipe-nutrition";
import { Check, ChevronDown, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PlannedIngredient {
	name: string;
	quantity?: number;
	unit?: string;
}

interface NutritionCoverageProps {
	nutrition: RecipeNutritionResult;
	plannedIngredients: PlannedIngredient[];
}

const amountFormatter = new Intl.NumberFormat("en", {
	maximumFractionDigits: 1,
});

function withOccurrenceKeys<T>(
	items: T[],
	identity: (item: T) => string,
): Array<{ key: string; value: T }> {
	const occurrences = new Map<string, number>();
	return items.map((value) => {
		const base = identity(value);
		const occurrence = (occurrences.get(base) ?? 0) + 1;
		occurrences.set(base, occurrence);
		return { key: `${base}-${occurrence}`, value };
	});
}

function ingredientReason(
	issue: Exclude<NutritionCoverageIssue, { reason: "unquantified-change" }>,
) {
	switch (issue.reason) {
		case "ingredient-unresolved":
			return "ingredient could not be resolved";
		case "reference-missing":
			return "nutrition reference unavailable";
		case "quantity-missing":
			return "quantity unknown";
		case "unit-unsupported":
			return "unit unsupported";
		case "portion-unavailable":
			return "no verified gram conversion for this portion";
	}
}

function fallbackIncludedIngredients(
	plannedIngredients: PlannedIngredient[],
	issues: NutritionCoverageIssue[],
) {
	const excludedNames = new Set(
		issues.flatMap((issue) =>
			issue.reason === "unquantified-change" ? [] : [issue.ingredientName],
		),
	);
	return plannedIngredients
		.filter((ingredient) => !excludedNames.has(ingredient.name))
		.map((ingredient) => ({
			name: ingredient.name,
			amount:
				ingredient.quantity === undefined
					? undefined
					: `${amountFormatter.format(ingredient.quantity)}${
							ingredient.unit ? ` ${ingredient.unit}` : ""
						}`,
		}));
}

export function NutritionCoverage({
	nutrition,
	plannedIngredients,
}: NutritionCoverageProps) {
	const issues =
		nutrition.status === "complete" ? [] : (nutrition.issues ?? []);
	const ingredientIssues = issues.filter(
		(
			issue,
		): issue is Exclude<
			NutritionCoverageIssue,
			{ reason: "unquantified-change" }
		> => issue.reason !== "unquantified-change",
	);
	const changeIssues = issues.filter(
		(
			issue,
		): issue is Extract<
			NutritionCoverageIssue,
			{ reason: "unquantified-change" }
		> => issue.reason === "unquantified-change",
	);
	const included = nutrition.includedIngredients
		? nutrition.includedIngredients.map((ingredient) => ({
				name: ingredient.name,
				amount: `${amountFormatter.format(ingredient.grams)} g`,
			}))
		: fallbackIncludedIngredients(plannedIngredients, issues);
	const keyedIncluded = withOccurrenceKeys(
		included,
		(ingredient) => `${ingredient.name}-${ingredient.amount ?? ""}`,
	);
	const keyedIngredientIssues = withOccurrenceKeys(
		ingredientIssues,
		(issue) =>
			`${issue.ingredientName}-${issue.reason}-${issue.ingredientKey ?? ""}-${issue.unit ?? ""}`,
	);
	const keyedChangeIssues = withOccurrenceKeys(
		changeIssues,
		(issue) => issue.changeDescription,
	);
	const status = {
		complete: {
			label: "Complete estimate",
			variant: "secondary" as const,
		},
		partial: { label: "Partial estimate", variant: "default" as const },
		unavailable: { label: "Not enough data", variant: "outline" as const },
	}[nutrition.status];

	return (
		<Card>
			<CardHeader className="space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<CardTitle>Calculation coverage</CardTitle>
					<Badge variant={status.variant}>{status.label}</Badge>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{nutrition.status === "complete"
						? `Calculated from all ${included.length} planned ingredients.`
						: nutrition.status === "partial"
							? `Calculated from ${included.length} of ${plannedIngredients.length} planned ingredients.`
							: "No planned ingredient had both a trusted gram amount and nutrition reference."}
				</p>
				{changeIssues.length > 0 ? (
					<p className="text-sm font-bold">
						{changeIssues.length}{" "}
						{changeIssues.length === 1 ? "recorded change" : "recorded changes"}{" "}
						could not be quantified, so this estimate stays based on the
						approved plan.
					</p>
				) : null}
			</CardHeader>
			<CardContent>
				<Collapsible>
					<CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl text-left text-sm font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
						See calculation details
						<ChevronDown
							className="size-5 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
							aria-hidden="true"
						/>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-6 border-t-2 pt-5">
						{included.length > 0 ? (
							<section className="space-y-3" aria-labelledby="included-title">
								<h3 id="included-title" className="font-heading text-lg">
									Included
								</h3>
								<ul className="space-y-2">
									{keyedIncluded.map(({ key, value: ingredient }) => (
										<li key={key} className="flex items-start gap-2 text-sm">
											<Check
												className="mt-0.5 size-4 shrink-0"
												aria-hidden="true"
											/>
											<span>
												<strong>{ingredient.name}</strong>
												{ingredient.amount ? ` — ${ingredient.amount}` : ""}
											</span>
										</li>
									))}
								</ul>
							</section>
						) : null}

						{ingredientIssues.length > 0 ? (
							<section className="space-y-3" aria-labelledby="excluded-title">
								<h3 id="excluded-title" className="font-heading text-lg">
									Not included
								</h3>
								<ul className="space-y-3">
									{keyedIngredientIssues.map(({ key, value: issue }) => (
										<li key={key} className="flex items-start gap-2 text-sm">
											<CircleAlert
												className="mt-0.5 size-4 shrink-0"
												aria-hidden="true"
											/>
											<span>
												<strong>{issue.ingredientName}</strong> —{" "}
												{ingredientReason(issue)}
											</span>
										</li>
									))}
								</ul>
							</section>
						) : null}

						{changeIssues.length > 0 ? (
							<section className="space-y-3" aria-labelledby="changes-title">
								<h3 id="changes-title" className="font-heading text-lg">
									Recorded changes not applied
								</h3>
								<ul className="space-y-2 text-sm">
									{keyedChangeIssues.map(({ key, value: issue }) => (
										<li key={key}>
											{issue.changeDescription} — not enough structured quantity
											data.
										</li>
									))}
								</ul>
							</section>
						) : null}
					</CollapsibleContent>
				</Collapsible>
			</CardContent>
		</Card>
	);
}
