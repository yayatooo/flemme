import { recipeCards } from "./data";
import { LandingRecipeCard } from "./recipe-card";
import { SectionHeading } from "./section-heading";

export function DiscoverSection() {
	return (
		<section id="discover" className="bg-background py-16 sm:py-20 lg:py-12">
			<div className="container mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
				<SectionHeading
					kicker="Discover"
					description="Flemme turns what you already have into meals worth cooking."
					compact
				>
					See what you can make.
				</SectionHeading>

				<div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
					{recipeCards.map((recipe, index) => (
						<LandingRecipeCard
							key={recipe.name}
							recipe={recipe}
							featured={index === 0}
							className={
								index === 0
									? "lg:col-span-2"
									: index === 1
										? "bg-secondary/25"
										: "bg-card"
							}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
