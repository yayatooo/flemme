import { Clock3 } from "lucide-react";

import { kickerClass } from "./styles";

export function PersonalizationSection() {
	return (
		<section
			className="
				relative
				isolate
				z-0
				overflow-hidden
				border-y
				border-border
				bg-mustard
				py-20
				sm:py-24
				lg:py-28
			"
		>
			<div className="container mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
				<div
					className="
						grid
						gap-16
						lg:grid-cols-[minmax(0,0.72fr)_minmax(34rem,1.28fr)]
						lg:items-center
						lg:gap-20
					"
				>
					{/* Copy */}
					<div className="max-w-xl">
						<p className={kickerClass}>Made for your kitchen</p>

						<h2
							className="
								mt-4
								text-[clamp(3.25rem,5.6vw,5.8rem)]
								leading-[0.92]
								font-extrabold
								tracking-[-0.055em]
								text-foreground
							"
						>
							Your dinner.
							<br />
							Your rules.
						</h2>

						<p
							className="
								mt-7
								max-w-md
								text-base
								leading-7
								text-foreground/80
								sm:text-lg
								sm:leading-8
							"
						>
							Flemme remembers the context that makes a recipe useful to you.
						</p>
					</div>

					<PersonalizationOrbit />
				</div>
			</div>
		</section>
	);
}

function PersonalizationOrbit() {
	const stickerClass = `
		absolute
		z-20
		inline-flex
		min-h-11
		items-center
		gap-2
		whitespace-nowrap
		rounded-full
		border
		border-foreground/15
		bg-card
		px-4
		py-2.5
		text-xs
		font-bold
		text-foreground
		shadow-control
		sm:text-sm
	`;

	return (
		<div
			className="
				relative
				mx-auto
				aspect-[1.2/1]
				w-full
				max-w-3xl
				sm:aspect-[1.35/1]
				lg:max-w-none
			"
			aria-label="Flemme considers your ingredients, taste, time, kitchen and household"
			role="img"
		>
			{/* Outer context orbit */}
			<div
				className="
					absolute
					inset-[12%_5%]
					rounded-[50%]
					border-2
					border-foreground/35
				"
				aria-hidden="true"
			/>

			{/* Inner soft focus area */}
			<div
				className="
					absolute
					top-1/2
					left-1/2
					h-[54%]
					w-[48%]
					-translate-x-1/2
					-translate-y-1/2
					rounded-full
					bg-background/15
				"
				aria-hidden="true"
			/>

			{/* Mascot */}
			<img
				className="
					absolute
					top-1/2
					left-1/2
					z-10
					w-[42%]
					max-w-72
					-translate-x-1/2
					-translate-y-1/2
					object-contain
					sm:w-[38%]
					lg:max-w-80
				"
				src="/mascot-thinking.png"
				alt=""
				aria-hidden="true"
			/>

			{/* Ingredients */}
			<span
				className={`
					${stickerClass}
					top-[12%]
					left-1/2
					-translate-x-1/2
					-translate-y-1/2
				`}
			>
				Your ingredients
			</span>

			{/* Taste */}
			<span
				className={`
					${stickerClass}
					top-[29%]
					right-[2%]
					bg-soft-pink
					sm:right-[3%]
				`}
			>
				Your taste
			</span>

			{/* Time */}
			<span
				className={`
					${stickerClass}
					top-1/2
					left-[1%]
					-translate-y-1/2
					sm:left-[2%]
				`}
			>
				<Clock3 className="size-4" aria-hidden="true" />
				Your time
			</span>

			{/* Kitchen */}
			<span
				className={`
					${stickerClass}
					bottom-[12%]
					left-[16%]
					translate-y-1/2
					bg-secondary
				`}
			>
				Your kitchen
			</span>

			{/* Household */}
			<span
				className={`
					${stickerClass}
					right-[9%]
					bottom-[12%]
					translate-y-1/2
				`}
			>
				Your household
			</span>
		</div>
	);
}
