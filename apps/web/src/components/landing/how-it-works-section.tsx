import { ArrowRight } from "lucide-react";

import { journey } from "./data";
import { SectionHeading } from "./section-heading";
import { groovyAccentClass, sectionClass } from "./styles";

export function HowItWorksSection() {
	return (
		<section className={sectionClass} id="how-it-works">
			<SectionHeading
				kicker="How it works"
				description="No chatbot maze. Just a clear path from a handful of ingredients to a finished plate."
			>
				From “what’s here?”
				<br />
				to <em className={groovyAccentClass}>so good.</em>
			</SectionHeading>

			<div
				className="
					border-t-2 border-foreground
					lg:grid
					lg:grid-cols-4
					lg:border-2
				"
			>
				{journey.map(([number, title, body], index) => {
					const isLast = index === journey.length - 1;

					return (
						<article
							key={number}
							className={`
								grid
								min-h-24
								grid-cols-[3rem_1fr_auto]
								items-center
								gap-4
								border-b-2 border-foreground
								py-6

								lg:min-h-68
								lg:grid-cols-1
								lg:content-start
								lg:border-b-0
								lg:p-7

								${isLast ? "lg:border-r-0" : "lg:border-r-2"}
							`}
						>
							<span className="font-heading text-2xl">{number}</span>

							<div>
								<h3 className="m-0 font-heading text-[1.35rem] font-normal lg:text-2xl">
									{title}
								</h3>

								<p className="mt-1 mb-0 text-sm leading-6 text-muted-foreground">
									{body}
								</p>
							</div>

							<ArrowRight className="size-5 lg:self-end" aria-hidden="true" />
						</article>
					);
				})}
			</div>
		</section>
	);
}
