import { ArrowRight, Clock3, Dumbbell, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LandingRecipe } from "./data";
import { RecipeArt } from "./recipe-art";

type LandingRecipeCardProps = {
	recipe: LandingRecipe;
	featured?: boolean;
	className?: string;
};

export function LandingRecipeCard({
	recipe,
	featured = false,
	className,
}: LandingRecipeCardProps) {
	return (
		<Card
			className={cn(
				`
					group
					overflow-hidden
					border-transparent
					p-0
					shadow-card
				`,
				featured ? "bg-primary/15" : "bg-card",
				className,
			)}
		>
			<div
				className={cn(
					"grid h-full",
					featured
						? "lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]"
						: "grid-rows-[auto_1fr] lg:grid-cols-[minmax(11rem,0.78fr)_minmax(0,1.22fr)] lg:grid-rows-1",
				)}
			>
				{/* Visual */}
				<div
					className={cn(
						featured
							? "min-h-56 p-3 lg:min-h-60"
							: "p-3 pb-0 lg:min-h-48 lg:pb-3",
					)}
				>
					{recipe.image ? (
						<img
							src={recipe.image.src}
							alt={recipe.image.alt}
							className={cn(
								"w-full rounded-2xl object-cover",
								featured
									? "h-full min-h-56"
									: "aspect-[16/9] min-h-48 sm:min-h-56 lg:h-full lg:min-h-0",
							)}
						/>
					) : (
						<RecipeArt
							tone={recipe.art}
							className={cn(
								"w-full",
								featured
									? "h-full min-h-56"
									: "aspect-[16/9] min-h-48 sm:min-h-56 lg:h-full lg:min-h-0",
							)}
						/>
					)}
				</div>

				{/* Content */}
				<div className="flex min-w-0 flex-col">
					<div
						className={cn(
							"flex flex-1 flex-col p-5 sm:p-6 lg:p-5",
							featured && "lg:p-7",
						)}
					>
						{/* Meta */}
						<div className="flex flex-wrap items-center gap-2 text-xs font-extrabold tracking-[0.11em] uppercase">
							<span>{recipe.detail}</span>

							<span
								className="size-1 rounded-full bg-foreground"
								aria-hidden="true"
							/>

							<span className="flex items-center gap-1.5 text-muted-foreground">
								<Clock3 className="size-4" aria-hidden="true" />
								{recipe.estimatedDuration}
							</span>
						</div>

						<h3
							className={cn(
								"mt-4 font-heading leading-tight font-bold tracking-[-0.035em]",
								featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
							)}
						>
							{recipe.name}
						</h3>

						<p
							className={cn(
								"mt-3 text-muted-foreground",
								featured ? "max-w-xl leading-7" : "text-sm leading-6",
							)}
						>
							{recipe.description}
						</p>

						{/* Footer */}
						{featured ? (
							<div className="mt-auto flex flex-col gap-5 pt-6 sm:flex-row sm:items-end sm:justify-between">
								<div className="flex flex-wrap gap-6 sm:gap-8">
									<RecipeMetric
										label="Calories"
										value={`${recipe.nutrition.calories} kcal`}
										icon={<Flame className="size-4" />}
									/>

									<RecipeMetric
										label="Protein"
										value={`${recipe.nutrition.protein}g`}
										icon={<Dumbbell className="size-4" />}
									/>
								</div>

								<Button
									className="min-h-12 shrink-0 justify-between gap-6 sm:min-w-40"
									render={<a href="#how-it-works" />}
								>
									View recipe
									<ArrowRight />
								</Button>
							</div>
						) : (
							<div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-5">
								<p className="m-0 text-sm font-bold text-muted-foreground">
									{recipe.nutrition.calories} kcal · {recipe.nutrition.protein}g
									protein
								</p>

								<Button
									variant="link"
									className="min-h-11 shrink-0 font-bold"
									render={<a href="#how-it-works" />}
								>
									View recipe
									<ArrowRight />
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}

type RecipeMetricProps = {
	label: string;
	value: string;
	icon: React.ReactNode;
};

function RecipeMetric({ label, value, icon }: RecipeMetricProps) {
	return (
		<div>
			<p className="text-[0.65rem] font-extrabold tracking-[0.12em] text-muted-foreground uppercase">
				{label}
			</p>

			<div className="mt-1.5 flex items-center gap-2">
				<span className="text-primary" aria-hidden="true">
					{icon}
				</span>

				<strong className="font-heading text-xl font-normal">{value}</strong>
			</div>
		</div>
	);
}
