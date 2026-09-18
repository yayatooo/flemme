import type { CookingRecommendation } from "@flemme/agent/cooking-recommendation-output";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	ChevronDown,
	CircleAlert,
	CircleX,
	Clock3,
	UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RecommendationCardProps {
	recommendation: CookingRecommendation;
	onSelect: (recommendation: CookingRecommendation) => void;
}

type Requirement =
	| CookingRecommendation["ingredients"][number]
	| CookingRecommendation["equipment"][number];

const feasibilityLabels: Record<CookingRecommendation["feasibility"], string> =
	{
		ready: "Ready to cook",
		needs_confirmation: "Needs a quick check",
		blocked: "Missing something",
	};

function durationLabel(duration: CookingRecommendation["estimatedDuration"]) {
	return duration.minMinutes === duration.maxMinutes
		? `${duration.minMinutes} min`
		: `${duration.minMinutes}–${duration.maxMinutes} min`;
}

function requirementCounts(requirements: ReadonlyArray<Requirement>) {
	return requirements.reduce(
		(counts, requirement) => {
			counts[requirement.status] += 1;
			return counts;
		},
		{ available: 0, unconfirmed: 0, missing: 0 },
	);
}

function ReadinessSummary({
	label,
	requirements,
}: {
	label: string;
	requirements: ReadonlyArray<Requirement>;
}) {
	const counts = requirementCounts(requirements);
	const allReady =
		requirements.length > 0 && counts.unconfirmed === 0 && counts.missing === 0;

	return (
		<div className="min-w-0 rounded-2xl border border-transparent bg-muted/55 p-3">
			<p className="text-[0.6875rem] font-extrabold tracking-wide uppercase">
				{label}
			</p>
			<div className="mt-2 space-y-0.5 text-sm leading-snug">
				{requirements.length === 0 ? (
					<p className="text-muted-foreground">None listed</p>
				) : (
					<>
						<p>{counts.available} available</p>
						{counts.unconfirmed > 0 ? (
							<p className="font-bold">{counts.unconfirmed} quick check</p>
						) : null}
						{counts.missing > 0 ? (
							<p className="font-bold text-destructive">
								{counts.missing} missing
							</p>
						) : null}
						{allReady ? (
							<p className="font-bold text-success">All ready</p>
						) : null}
					</>
				)}
			</div>
		</div>
	);
}

function RequiredConfirmations({ items }: { items: readonly string[] }) {
	if (items.length === 0) return null;
	return (
		<div className="rounded-2xl border border-transparent bg-mustard/40 p-4">
			<p className="flex items-center gap-2 text-xs font-extrabold tracking-wide uppercase">
				<CircleAlert className="size-4" aria-hidden="true" />
				Quick check
			</p>
			<ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
				{items.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	);
}

function PreferenceMatches({ items }: { items: readonly string[] }) {
	if (items.length === 0) return null;
	return (
		<div className="space-y-2">
			<p className="text-xs font-extrabold tracking-wide uppercase">Matches</p>
			<div className="flex flex-wrap gap-2">
				{items.map((item) => (
					<Badge key={item} variant="secondary">
						{item}
					</Badge>
				))}
			</div>
		</div>
	);
}

function RequirementDetails({
	label,
	requirements,
}: {
	label: string;
	requirements: ReadonlyArray<Requirement>;
}) {
	return (
		<section className="space-y-3">
			<h3 className="font-heading text-xl">{label}</h3>
			{requirements.length === 0 ? (
				<p className="text-sm text-muted-foreground">None listed.</p>
			) : (
				<ul className="space-y-3">
					{requirements.map((requirement) => {
						const amount =
							"requiredAmount" in requirement
								? requirement.requiredAmount
								: undefined;
						return (
							<li
								key={`${requirement.name}-${requirement.status}`}
								className="flex items-start gap-3"
							>
								{requirement.status === "available" ? (
									<Check
										className="mt-0.5 size-4 shrink-0 text-success"
										aria-hidden="true"
									/>
								) : requirement.status === "unconfirmed" ? (
									<CircleAlert
										className="mt-0.5 size-4 shrink-0"
										aria-hidden="true"
									/>
								) : (
									<CircleX
										className="mt-0.5 size-4 shrink-0 text-destructive"
										aria-hidden="true"
									/>
								)}
								<div className="min-w-0 flex-1">
									<p className="font-bold">
										<span className="sr-only">
											{requirement.status === "available"
												? "Available: "
												: requirement.status === "unconfirmed"
													? "Check: "
													: "Missing: "}
										</span>
										{requirement.name}
									</p>
									{amount ? (
										<p className="text-sm text-muted-foreground">{amount}</p>
									) : null}
									{requirement.note ? (
										<p className="text-sm leading-relaxed text-muted-foreground">
											{requirement.note}
										</p>
									) : null}
								</div>
								{requirement.status !== "available" ? (
									<Badge
										variant={
											requirement.status === "missing"
												? "destructive"
												: "outline"
										}
										className={
											requirement.status === "unconfirmed"
												? "shrink-0 bg-mustard"
												: "shrink-0"
										}
									>
										{requirement.status === "missing" ? "Missing" : "Check"}
									</Badge>
								) : null}
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

function RecommendationDetails({
	recommendation,
}: {
	recommendation: CookingRecommendation;
}) {
	return (
		<Collapsible>
			<CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-1 text-left text-sm font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
				See ingredients &amp; equipment
				<ChevronDown
					className="size-5 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
					aria-hidden="true"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="border-t border-border pt-4">
				<div className="space-y-6">
					<RequirementDetails
						label="Ingredients"
						requirements={recommendation.ingredients}
					/>
					<RequirementDetails
						label="Equipment"
						requirements={recommendation.equipment}
					/>
					{recommendation.optionalIngredients.length > 0 ? (
						<section className="space-y-3 text-muted-foreground">
							<h3 className="font-heading text-xl text-foreground">Optional</h3>
							<ul className="space-y-2">
								{recommendation.optionalIngredients.map((ingredient) => (
									<li key={ingredient.name}>
										<p className="font-bold text-foreground">
											{ingredient.name}
										</p>
										{ingredient.note ? (
											<p className="text-sm leading-relaxed">
												{ingredient.note}
											</p>
										) : null}
									</li>
								))}
							</ul>
						</section>
					) : null}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function RecommendationCard({
	recommendation,
	onSelect,
}: RecommendationCardProps) {
	return (
		<Card className="gap-0 border-transparent py-0 shadow-card">
			<div className="space-y-5 p-5 sm:p-6">
				<Badge
					variant={
						recommendation.feasibility === "blocked"
							? "destructive"
							: "secondary"
					}
				>
					{feasibilityLabels[recommendation.feasibility]}
				</Badge>

				<header className="space-y-3">
					<h2 className="font-heading text-3xl leading-[0.95] sm:text-4xl">
						{recommendation.name}
					</h2>
					<p className="leading-relaxed text-muted-foreground">
						{recommendation.reason}
					</p>
				</header>

				<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
					<span className="inline-flex items-center gap-1.5">
						<Clock3 className="size-4" aria-hidden="true" />
						{durationLabel(recommendation.estimatedDuration)}
					</span>
					<span className="inline-flex items-center gap-1.5">
						<UsersRound className="size-4" aria-hidden="true" />
						{recommendation.servings}{" "}
						{recommendation.servings === 1 ? "serving" : "servings"}
					</span>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<ReadinessSummary
						label="Ingredients"
						requirements={recommendation.ingredients}
					/>
					<ReadinessSummary
						label="Equipment"
						requirements={recommendation.equipment}
					/>
				</div>

				<RequiredConfirmations items={recommendation.requiredConfirmations} />

				{recommendation.warnings.length > 0 ? (
					<div className="flex gap-2 text-sm font-bold text-destructive">
						<AlertTriangle
							className="mt-0.5 size-4 shrink-0"
							aria-hidden="true"
						/>
						<p>{recommendation.warnings.join(" ")}</p>
					</div>
				) : null}

				<PreferenceMatches items={recommendation.preferenceMatches} />

				<RecommendationDetails recommendation={recommendation} />

				<Button
					type="button"
					size="lg"
					variant="outline"
					className="w-full border-transparent bg-forest text-card! shadow-none hover:bg-forest/90 [&_svg]:text-card!"
					onClick={() => onSelect(recommendation)}
				>
					Select recipe
					<ArrowRight aria-hidden="true" />
				</Button>
			</div>
		</Card>
	);
}
