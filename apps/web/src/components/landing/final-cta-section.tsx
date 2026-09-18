import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { kickerClass } from "./styles";

export function FinalCtaSection() {
	return (
		<section
			className="
				relative
				overflow-hidden
				bg-forest
				px-5
				py-24
				text-background
				sm:px-6
				sm:py-28
				lg:py-36
			"
		>
			<div
				className="
					mx-auto
					grid
					max-w-7xl
					gap-10
					lg:grid-cols-[minmax(0,1fr)_auto]
					lg:items-end
				"
			>
				<div className="max-w-4xl">
					<p className={`${kickerClass} text-mustard!`}>
						Dinner is waiting
					</p>

					<h2
						className="
							mt-4
							text-[clamp(3.5rem,8vw,7rem)]
							leading-[0.9]
							font-extrabold
							tracking-[-0.06em]
						"
					>
						Still wondering
						<br />
						what to cook?
					</h2>

					<p
						className="
							mt-7
							max-w-xl
							text-lg
							leading-8
							text-background/75
						"
					>
						Open your fridge. Flemme will help with the rest.
					</p>
				</div>

				<Button
					className="
						min-h-14
						w-fit
						rounded-full
						bg-primary
						px-8
						text-base
						font-bold
						text-primary-foreground
						shadow-none
						lg:mb-2
					"
					size="lg"
					render={<Link to="/register" />}
				>
					Start cooking
					<ArrowRight />
				</Button>
			</div>
		</section>
	);
}
