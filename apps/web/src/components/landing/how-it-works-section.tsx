import { ArrowRight } from "lucide-react";

import { journey } from "./data";
import { SectionHeading } from "./section-heading";
import { sectionClass } from "./styles";

export function HowItWorksSection() {
	return (
		<section className={sectionClass} id="how-it-works">
			<SectionHeading
				kicker="How it works"
				description="Flemme keeps the path simple—from checking what’s in your kitchen to guiding you through the final step."
			>
				From what you have
				<br />
				to something worth cooking.
			</SectionHeading>

			<div
				className="
					mt-10
					overflow-hidden
					rounded-2xl
					border
					border-border
					bg-card
					shadow-card
					lg:mt-14
				"
			>
				<div className="grid lg:grid-cols-4">
					{journey.map(([number, title, body], index) => {
						const isLast = index === journey.length - 1;

						return (
							<article
								key={number}
								className="
									relative
									min-h-52
									border-b
									border-border
									p-6
									sm:p-7
									lg:min-h-80
									lg:border-r
									lg:border-b-0
									lg:p-8
									last:border-0
								"
							>
								<div className="flex items-start justify-between gap-4">
									<span
										className="
											text-4xl
											font-extrabold
											tracking-tighter
											text-primary
											lg:text-5xl
										"
									>
										{number}
									</span>

									{!isLast ? (
										<ArrowRight
											className="
												hidden
												size-5
												text-muted-foreground/60
												lg:block
											"
											aria-hidden="true"
										/>
									) : null}
								</div>

								<div className="mt-10 lg:mt-20">
									<h3
										className="
											m-0
											text-2xl
											font-bold
											tracking-[-0.03em]
											text-foreground
										"
									>
										{title}
									</h3>

									<p
										className="
											mt-3
											mb-0
											max-w-xs
											text-sm
											leading-6
											text-muted-foreground
										"
									>
										{body}
									</p>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
}
