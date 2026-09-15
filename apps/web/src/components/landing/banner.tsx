import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";

function HeroVisual() {
	return (
		<div
			className="relative mx-auto w-full max-w-136"
			aria-label="A playful bowl filled with fresh ingredients"
			role="img"
		>
			<div className="relative aspect-4/3 sm:aspect-5/4 lg:aspect-square">
				{/* Main background shape */}
				<div
					className="
						absolute inset-4
						rotate-2
						rounded-[3rem]
						border-[3px] border-foreground
						bg-mustard
						shadow-hard-lg
					"
					aria-hidden="true"
				/>

				{/* Lavender decorative circle */}
				<div
					className="
						absolute top-[8%] right-[2%]
						size-20
						rounded-full
						border-[3px] border-foreground
						bg-lavender
						sm:size-24
					"
					aria-hidden="true"
				/>

				{/* Tomato */}
				<div
					className="
						absolute top-[22%] left-[20%]
						z-10
						grid size-20
						place-items-center
						rounded-full
						border-[3px] border-foreground
						bg-tomato
						sm:size-24
					"
					aria-hidden="true"
				>
					<span
						className="
							absolute -top-4
							h-7 w-10
							bg-secondary
							[clip-path:polygon(50%_45%,100%_0,75%_55%,100%_100%,51%_75%,0_100%,27%_53%,0_0)]
						"
					/>
				</div>

				{/* Egg */}
				<div
					className="
						absolute top-[24%] right-[15%]
						z-10
						grid h-20 w-28
						rotate-10
						place-items-center
						rounded-[48%_52%_50%_46%]
						border-[3px] border-foreground
						bg-card
						sm:h-24 sm:w-32
					"
					aria-hidden="true"
				>
					<span className="size-10 rounded-full border-2 border-foreground bg-primary sm:size-12" />
				</div>

				{/* Leaf */}
				<div
					className="
						absolute top-[9%] left-[45%]
						z-10
						grid h-24 w-14
						rotate-12
						place-items-center
						rounded-[100%_0_100%_0]
						border-[3px] border-foreground
						bg-secondary
						text-4xl
						sm:h-28 sm:w-16
					"
					aria-hidden="true"
				>
					⌁
				</div>

				{/* Small decoration */}
				<div
					className="
						absolute top-[17%] left-[7%]
						z-10
						grid size-14
						-rotate-12
						place-items-center
						rounded-full
						border-[3px] border-foreground
						bg-soft-pink
						text-2xl
					"
					aria-hidden="true"
				>
					◎
				</div>

				{/* Plate */}
				<div
					className="
						absolute top-[42%] left-[11%]
						z-20
						grid h-20 w-[78%]
						-rotate-3
						place-items-center
						rounded-full
						border-[3px] border-foreground
						bg-background
					"
				>
					<div
						className="
							absolute inset-3
							rounded-full
							border-2 border-foreground
							bg-primary
						"
					/>

					<span
						className="
							relative z-10
							rounded-full
							bg-background
							px-3 py-1
							text-[0.65rem]
							font-black
							tracking-widest
							uppercase
						"
					>
						tonight&apos;s dinner
					</span>
				</div>

				{/* Bowl */}
				<div
					className="
						absolute top-[51%] left-[17%]
						z-10
						grid h-34 w-[66%]
						-rotate-3
						place-items-end
						overflow-hidden
						rounded-[0_0_48%_48%/0_0_90%_90%]
						border-[3px] border-foreground
						bg-primary
						sm:h-40
					"
				>
					<Flame
						className="mb-6 size-11 stroke-[2.5] text-background"
						aria-hidden="true"
					/>
				</div>

				{/* Decorative stars */}
				<span
					className="absolute top-[15%] right-[4%] text-3xl"
					aria-hidden="true"
				>
					✦
				</span>

				<span
					className="absolute bottom-[10%] left-[6%] text-3xl"
					aria-hidden="true"
				>
					✦
				</span>

				{/* Groovy note */}
				<p
					className="
						absolute right-[2%] bottom-[3%]
						rotate-7
						font-['Shrikhand']
						text-xs leading-tight
						sm:text-sm
					"
				>
					made with what
					<br />
					you already have
				</p>
			</div>
		</div>
	);
}

export function LandingBanner() {
	return (
		<section
			id="top"
			className="relative overflow-hidden bg-background pt-28 sm:pt-32 lg:pt-36"
		>
			<div className="container mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
				<div
					className="
						grid
						min-h-[calc(100svh-7rem)]
						items-center
						gap-12
						py-12
						lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)]
						lg:gap-16
						lg:py-20
					"
				>
					{/* Copy */}
					<div className="relative z-10">
						<p
							className="
								text-xs
								font-extrabold
								tracking-[0.16em]
								text-foreground
								uppercase
							"
						>
							Your everyday cooking companion
						</p>

						<h1
							className="
								mt-4
								max-w-[9ch]
								font-heading
								text-[clamp(3.6rem,16vw,6rem)]
								leading-[0.88]
								font-normal
								tracking-[-0.045em]
								lg:text-[clamp(5rem,7vw,7rem)]
							"
						>
							Buka kulkas,
							<br />
							<em
								className="
									font-['Shrikhand']
									font-normal
									text-primary
									not-italic
								"
							>
								bukan
							</em>
							<br />
							kebingungan.
						</h1>

						<p
							className="
								mt-6
								max-w-lg
								text-base
								leading-7
								text-muted-foreground
								lg:text-lg
							"
						>
							Tell Flemme what you have. We&apos;ll figure out what you can
							cook—then cook it together, step by step.
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
							<Button
								size="lg"
								className="w-full sm:w-auto"
								render={<Link to="/register" />}
							>
								Start cooking
								<ArrowRight />
							</Button>

							<Button
								size="lg"
								variant="outline"
								className="w-full sm:w-auto"
								render={<a href="#how-it-works" />}
							>
								See how it works
								<ChevronDown />
							</Button>
						</div>
					</div>

					{/* Visual */}
					<HeroVisual />
				</div>
			</div>
		</section>
	);
}
