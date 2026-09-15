import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";

interface IngredientRequirementsProps {
	ingredients: PreCookingOutput["ingredients"];
}

export function IngredientRequirements({
	ingredients,
}: IngredientRequirementsProps) {
	return (
		<section className="space-y-4" aria-labelledby="ingredients-heading">
			<header className="space-y-1">
				<h2 id="ingredients-heading" className="font-heading text-2xl">
					Ingredients
				</h2>
				<p className="text-sm text-muted-foreground">
					Measure these before you begin.
				</p>
			</header>
			{ingredients.length > 0 ? (
				<ul className="divide-y divide-border border-y border-border">
					{ingredients.map((ingredient) => {
						const amount = [ingredient.quantity, ingredient.unit]
							.filter((value) => value !== undefined)
							.join(" ");
						return (
							<li
								key={ingredient.name}
								className="flex min-w-0 items-baseline justify-between gap-4 py-3"
							>
								<span className="min-w-0 font-bold break-words">
									{ingredient.name}
								</span>
								{amount ? (
									<span className="shrink-0 text-right text-sm text-muted-foreground">
										{amount}
									</span>
								) : null}
							</li>
						);
					})}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">
					No ingredient requirements listed.
				</p>
			)}
		</section>
	);
}
