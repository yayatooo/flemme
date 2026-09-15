import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { recipeCards } from "./data";
import { LandingRecipeCard } from "./recipe-card";
import { SectionHeading } from "./section-heading";

export function DiscoverSection() {
	return (
		<section id="discover" className="bg-background py-20 sm:py-24 lg:py-32">
			<div className="container mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
				<SectionHeading
					kicker="Discover"
					description="Recipes shaped around your ingredients, not another shopping list. Browse ideas, pick one, and make it yours."
				>
					Good food is already{" "}
					<em className="font-['Shrikhand'] font-normal text-primary not-italic">
						in there.
					</em>
				</SectionHeading>

				<div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2">
					{recipeCards.map((recipe, index) => (
						<LandingRecipeCard
							key={recipe.name}
							recipe={recipe}
							featured={index === 0}
							className={index === 0 ? "lg:col-span-2" : undefined}
						/>
					))}
				</div>

				<div className="mt-10 flex justify-start">
					<Button variant="link" render={<a href="#how-it-works" />}>
						See what Flemme can do
						<ArrowRight />
					</Button>
				</div>
			</div>
		</section>
	);
}
