import { accentHeadingClass, kickerClass } from "./styles";

export function AboutSection() {
	return (
		<section
			id="about"
			className="
				relative
				overflow-hidden
				border-y
				border-border
				bg-primary
				px-5
				py-20
				sm:px-6
				sm:py-24
				lg:px-[max(2rem,calc((100vw-var(--container))/2))]
				lg:py-28
			"
		>
			<div
				className="
					mx-auto
					grid
					w-full
					max-w-(--container)
					items-center
					gap-10
					lg:grid-cols-[minmax(14rem,0.55fr)_minmax(24rem,1fr)_minmax(20rem,0.8fr)]
					lg:gap-14
				"
			>
				{/* Mascot */}
				<div
					className="
						relative
						flex
						justify-center
						lg:justify-start
					"
				>
					<div
						className="
							absolute
							inset-1/2
							aspect-square
							w-[82%]
							-max-translate-x-1/2
							-max-translate-y-1/2
							rounded-full
							bg-background/12
						"
						aria-hidden="true"
					/>

					<img
						src="/mascot.png"
						alt="Joyful Flemme otter chef mascot"
						className="
							relative
							z-10
							w-full
							max-w-64
							object-contain
							sm:max-w-72
							lg:max-w-80
						"
					/>
				</div>

				{/* Headline */}
				<div>
					<p className={kickerClass}>About Flemme</p>

					<h2
						className="
							mt-4
							max-w-3xl
							text-[clamp(3rem,5.5vw,5.75rem)]
							leading-[0.92]
							font-extrabold
							tracking-[-0.055em]
							text-foreground
						"
					>
						Your fridge
						<br />
						already has{" "}
						<em
							className={`${accentHeadingClass} text-background! not-italic`}
						>
							ideas.
						</em>
					</h2>
				</div>

				{/* Copy */}
				<div
					className="
						grid
						gap-7
						border-t
						border-foreground/20
						pt-7
						lg:border-t-0
						lg:pt-0
					"
				>
					<p
						className="
							m-0
							max-w-xl
							text-[1.05rem]
							leading-[1.7]
							font-medium
							text-foreground
						"
					>
						Flemme looks at the whole kitchen—not just one ingredient.
						What’s in the cupboard, the tools you own, who’s eating, and
						what you actually like.
					</p>

					<p
						className="
							m-0
							max-w-xl
							text-[1.05rem]
							leading-[1.7]
							font-semibold
							text-foreground
						"
					>
						Less deciding. Less waste. More dinners that make sense for
						real life.
					</p>
				</div>
			</div>
		</section>
	);
}
