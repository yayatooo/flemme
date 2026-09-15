import { Clock3 } from "lucide-react";

import { groovyAccentClass, headingClass, kickerClass } from "./styles";

export function PersonalizationSection() {
	return (
		<section
			className="
				border-y-[3px]
				border-foreground
				bg-mustard
				py-20
				sm:py-24
				lg:py-32
			"
		>
			<div className="container mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
				<div
					className="
						grid
						gap-14
						lg:grid-cols-[minmax(0,0.8fr)_minmax(32rem,1.2fr)]
						lg:items-center
						lg:gap-20
					"
				>
					<div className="max-w-xl">
						<p className={kickerClass}>Made for your kitchen</p>

						<h2 className={headingClass}>
							Your dinner.
							<br />
							<em className={groovyAccentClass}>Your rules.</em>
						</h2>

						<p className="mt-5 max-w-md text-base leading-7 lg:text-lg">
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
		items-center
		gap-1.5
		whitespace-nowrap
		rounded-full
		border-[3px]
		border-foreground
		bg-background
		px-4
		py-2.5
		text-xs
		font-extrabold
		shadow-[4px_4px_0_var(--ink)]
	`;

	return (
		<div
			className="
				relative
				mx-auto
				aspect-[1.35/1]
				w-full
				max-w-2xl
				lg:aspect-[1.3/1]
				lg:max-w-none
			"
			aria-label="Flemme personalizes recipes to your context"
			role="img"
		>
			{/* Orbit */}
			<div
				className="
					absolute
					inset-[16%_9%]
					rounded-full
					border-[3px]
					border-dashed
					border-foreground
				"
				aria-hidden="true"
			/>

			{/* Center mascot */}
			<img
				className="
					absolute
					top-1/2
					left-1/2
					z-10
					size-80
					-translate-x-1/2
					-translate-y-1/2
					object-contain
					lg:size-48
				"
				src="/brain-flemme.png"
				alt=""
				aria-hidden="true"
			/>

			{/* Top — sits directly on orbit */}
			<span
				className={`
					${stickerClass}

					top-[16%]
					left-1/2
					-translate-x-1/2
					-translate-y-1/2
					-rotate-2
				`}
			>
				Your ingredients
			</span>

			{/* Right upper */}
			<span
				className={`
					${stickerClass}

					top-[29%]
					right-[5%]
					translate-x-[8%]
					-translate-y-1/2
					rotate-3
					bg-soft-pink
				`}
			>
				Your taste
			</span>

			{/* Left middle */}
			<span
				className={`
					${stickerClass}

					top-1/2
					left-[7%]
					translate-x-[-12%]
					-translate-y-1/2
				`}
			>
				<Clock3 className="size-4" aria-hidden="true" />
				Your time
			</span>

			{/* Bottom left */}
			<span
				className={`
					${stickerClass}

					bottom-[17%]
					left-[17%]
					-translate-x-1/2
					translate-y-1/2
					rotate-2
					bg-secondary
				`}
			>
				Your kitchen
			</span>

			{/* Bottom right */}
			<span
				className={`
					${stickerClass}

					right-[12%]
					bottom-[17%]
					translate-x-[10%]
					translate-y-1/2
					-rotate-2
					bg-accent
				`}
			>
				Your household
			</span>
		</div>
	);
}
