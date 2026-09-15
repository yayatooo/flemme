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
					border-[3px] border-foreground
					bg-card
					p-0
					shadow-hard
					transition-transform
					duration-200
					hover:-translate-y-1
				`,
				className,
			)}
		>
			<div
				className={cn(
					"grid h-full",
					featured
						? "lg:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]"
						: "sm:grid-cols-[minmax(11rem,0.8fr)_minmax(0,1.2fr)]",
				)}
			>
				{/* Visual */}
				<div className={cn("min-h-56 p-4", featured && "lg:min-h-80")}>
					{recipe.image ? (
						<img
							src={recipe.image.src}
							alt={recipe.image.alt}
							className="
								h-full
								min-h-56
								w-full
								rounded-2xl
								border-[3px] border-foreground
								object-cover
							"
						/>
					) : (
						<RecipeArt tone={recipe.art} className="h-full min-h-56 w-full" />
					)}
				</div>

				{/* Content */}
				<div className="flex min-w-0 flex-col">
					<div
						className={cn(
							"flex flex-1 flex-col p-5 sm:p-6",
							featured && "lg:p-8",
						)}
					>
						{/* Meta */}
						<div className="flex flex-wrap items-center gap-2 text-xs font-black tracking-[0.11em] uppercase">
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
								"mt-4 font-heading leading-[0.95] font-normal tracking-[-0.03em]",
								featured ? "text-4xl sm:text-5xl" : "text-3xl",
							)}
						>
							{recipe.name}
						</h3>

						<p
							className={cn(
								"mt-4 leading-7 text-muted-foreground",
								featured && "max-w-xl",
							)}
						>
							{recipe.description}
						</p>

						{/* Footer */}
						<div
							className="
								mt-auto
								flex
								flex-col
								gap-5
								pt-8
								sm:flex-row
								sm:items-end
								sm:justify-between
							"
						>
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
								className="
									min-h-12
									shrink-0
									justify-between
									gap-6
									sm:min-w-40
								"
								render={<a href="#how-it-works" />}
							>
								View recipe
								<ArrowRight />
							</Button>
						</div>
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
			<p className="text-[0.65rem] font-black tracking-[0.12em] text-muted-foreground uppercase">
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
