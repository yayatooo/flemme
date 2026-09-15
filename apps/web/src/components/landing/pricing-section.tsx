import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "./section-heading";
import { sectionClass } from "./styles";

export function PricingSection() {
	return (
		<section className={sectionClass} id="pricing">
			<SectionHeading
				kicker="Pricing"
				description="Flemme is currently in early access. Create an account and be among the first at the table."
			>
				Come cook with us.
			</SectionHeading>
			<Card className="grid gap-8 bg-mustard p-6 py-6 shadow-hard-lg sm:p-10 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center lg:gap-12">
				<div>
					<Badge
						variant="outline"
						className="-rotate-2 bg-background uppercase tracking-[0.09em]"
					>
						Early access
					</Badge>
					<h3 className="mt-4 mb-3 font-heading text-[clamp(2rem,8vw,3.2rem)] leading-none font-normal">
						Your next dinner starts here.
					</h3>
					<p className="m-0 max-w-2xl leading-[1.65]">
						Set up your taste, kitchen, household, and ingredients. Flemme will
						keep them ready for the meals ahead.
					</p>
				</div>
				<ul className="m-0 grid list-none gap-3 p-0">
					{[
						"Personal cooking context",
						"Ideas from what you have",
						"Guided cooking, step by step",
					].map((item) => (
						<li className="flex items-center gap-2.5 font-bold" key={item}>
							<Check className="size-5 rounded-full border-2 border-foreground bg-secondary p-0.5" />
							{item}
						</li>
					))}
				</ul>
				<Button className="whitespace-nowrap" render={<Link to="/register" />}>
					Get started <ArrowRight />
				</Button>
			</Card>
		</section>
	);
}
