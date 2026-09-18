import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";
import { sectionClass } from "./styles";

const features = [
	"Personal cooking context",
	"Ideas from what you have",
	"Guided cooking, step by step",
];

export function PricingSection() {
	return (
		<section className={sectionClass} id="pricing">
			<SectionHeading
				kicker="Pricing"
				description="Flemme is currently in early access. Create an account and be among the first at the table."
			>
				Come cook with us.
			</SectionHeading>

			<div
				className="
					mt-10
					overflow-hidden
					rounded-2xl
					border
					border-border
					bg-primary
					shadow-card
					lg:mt-14
				"
			>
				<div
					className="
						grid
						gap-0
						lg:grid-cols-[1.15fr_0.85fr]
					"
				>
					{/* Main offer */}
					<div
						className="
							flex
							min-h-96
							flex-col
							justify-between
							p-7
							sm:p-10
							lg:min-h-120
							lg:p-12
						"
					>
						<div>
							<p
								className="
									m-0
									text-xs
									font-extrabold
									tracking-[0.14em]
									text-foreground
									uppercase
								"
							>
								Early access
							</p>

							<h3
								className="
									mt-5
									max-w-3xl
									text-[clamp(3rem,6vw,5.5rem)]
									leading-[0.92]
									font-extrabold
									tracking-[-0.055em]
									text-foreground
								"
							>
								Your next dinner
								<br />
								starts here.
							</h3>

							<p
								className="
									mt-6
									max-w-xl
									text-base
									leading-7
									text-background
									sm:text-lg
								"
							>
								Set up your taste, kitchen, household, and ingredients.
								Flemme keeps the context ready for whatever you cook next.
							</p>
						</div>

						<Button
							className="
								mt-10
								w-fit
								min-h-12
								rounded-full
								bg-foreground
								text-background!
								px-7
								shadow-none
							"
							render={<Link to="/register" />}
						>
							Get started
							<ArrowRight />
						</Button>
					</div>

					{/* Included */}
					<div
						className="
							border-t
							border-foreground/15
							bg-background/35
							p-7
							sm:p-10
							lg:border-t-0
							lg:border-l
							lg:p-12
						"
					>
						<p
							className="
								m-0
								text-xs
								font-extrabold
								tracking-[0.14em]
								text-foreground
								uppercase
							"
						>
							What’s included
						</p>

						<ul className="mt-8 grid list-none gap-6 p-0">
							{features.map((item) => (
								<li
									key={item}
									className="
										flex
										items-start
										gap-4
										text-base
										font-semibold
										text-foreground
										sm:text-lg
									"
								>
									<span
										className="
											inline-flex
											size-9
											shrink-0
											items-center
											justify-center
											rounded-full
											bg-secondary
										"
									>
										<Check className="size-4" aria-hidden="true" />
									</span>

									<span className="pt-1">{item}</span>
								</li>
							))}
						</ul>

						<div
							className="
								mt-12
								border-t
								border-foreground/15
								pt-8
							"
						>
							<p className="m-0 text-sm leading-6 text-foreground/70">
								Early access is focused on the core Flemme cooking experience
								while the product continues to grow.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
