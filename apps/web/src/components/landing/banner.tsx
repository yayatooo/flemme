import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	ChefHat,
	Heart,
	Leaf,
	type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandTicker } from "./brand-ticker";

const benefits: ReadonlyArray<{
	label: string;
	lineBreak: string;
	icon: LucideIcon;
	iconClassName: string;
}> = [
	{
		label: "Use what",
		lineBreak: "you have",
		icon: Leaf,
		iconClassName: "bg-secondary/55",
	},
	{
		label: "Simple, creative",
		lineBreak: "recipes",
		icon: ChefHat,
		iconClassName: "bg-primary/15 text-primary",
	},
	{
		label: "Make cooking",
		lineBreak: "enjoyable",
		icon: Heart,
		iconClassName: "bg-secondary/55",
	},
];

export function LandingBanner() {
	return (
		<section
			id="top"
			className="flex flex-col bg-background lg:min-h-[clamp(45rem,78svh,51.25rem)]"
		>
			<div className="container mx-auto flex max-w-7xl flex-1 items-center px-5 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-24">
				<div className="grid w-full items-start gap-x-6 gap-y-10 pb-14 sm:pb-18 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:grid-rows-[auto_1fr] lg:items-center lg:gap-y-10 lg:py-10">
					<div className="relative z-10 lg:self-end">
						<div className="flex items-center gap-3">
							<span
								className="h-0.5 w-9 shrink-0 rounded-full bg-primary"
								aria-hidden="true"
							/>
							<p className="text-[0.6875rem] font-extrabold tracking-[0.16em] text-muted-foreground uppercase sm:text-xs">
								Good food. Less overthinking.
							</p>
						</div>

						<h1 className="mt-6 max-w-[12ch] font-heading text-[clamp(3rem,13vw,4rem)] leading-[0.96] font-black tracking-[-0.055em] text-foreground lg:max-w-[14ch] lg:text-[clamp(3.75rem,5vw,4.5rem)]">
							<span className="block">Let Flemme do the thinking.</span>
							<span className="mt-2 block">You do the cooking.</span>
						</h1>

						<p className="mt-7 max-w-136 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
							Tell us what’s in your kitchen. Flemme turns what you have into
							practical meal ideas and guides you through every step.
						</p>

						<div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-7">
							<Button
								size="lg"
								className="w-full px-7 border-0 sm:w-auto text-cream!"
								render={<Link to="/register" />}
							>
								Get Started
								<ArrowRight aria-hidden="true" />
							</Button>

							<a
								className="inline-flex min-h-12 items-center justify-center border-b-2 border-foreground px-1 text-center font-bold text-foreground no-underline transition-colors hover:border-primary hover:text-primary"
								href="#how-it-works"
							>
								See How It Works
							</a>
						</div>
					</div>

					<div className="flex min-h-0 items-end justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end lg:self-end">
						<img
							src="/banner-mascot.png"
							alt="Flemme otter chef preparing ingredients beside a nasi goreng recipe"
							width={1448}
							height={1086}
							fetchPriority="high"
							className="h-auto w-full max-w-3xl object-contain object-bottom lg:w-[108%] lg:max-w-162.5"
						/>
					</div>

					<div className="grid overflow-hidden rounded-platform-card bg-card px-4 py-2 shadow-card sm:grid-cols-3 sm:gap-3 sm:bg-transparent sm:p-0 sm:shadow-none lg:self-start">
						{benefits.map((benefit) => {
							const Icon = benefit.icon;

							return (
								<div
									className="flex min-w-0 items-center gap-3 border-b border-border/40 py-3 last:border-b-0 sm:items-start sm:border-b-0 sm:py-0"
									key={benefit.label}
								>
									<span
										className={`grid size-10 shrink-0 place-items-center rounded-xl ${benefit.iconClassName}`}
									>
										<Icon
											className="size-5"
											strokeWidth={2.25}
											aria-hidden="true"
										/>
									</span>
									<p className="m-0 text-sm leading-5 font-bold text-foreground">
										{benefit.label}
										<br />
										{benefit.lineBreak}
									</p>
								</div>
							);
						})}
					</div>
				</div>
      </div>
			<section className="pt-16">
				<BrandTicker />
			</section>
		</section>
	);
}
