import { groovyAccentClass, headingClass, kickerClass } from "./styles";

export function AboutSection() {
	return (
		<section
			className="relative grid gap-10 border-y-[3px] border-foreground bg-primary px-5 py-24 lg:grid-cols-[minmax(12rem,0.45fr)_minmax(24rem,1fr)_minmax(20rem,0.8fr)] lg:items-center lg:px-[max(2rem,calc((100vw-var(--container))/2))] lg:py-32"
			id="about"
		>
			<img
				className="hidden size-60 -rotate-6 object-contain lg:block"
				src="/flemme-mascot.png"
				alt="Flemme cooking fish mascot"
			/>
			<div className="mx-auto w-full max-w-(--container) lg:w-auto">
				<p className={kickerClass}>About Flemme</p>
				<h2 className={headingClass}>
					Your fridge already has{" "}
					<em className={`${groovyAccentClass} text-background!`}>ideas.</em>
				</h2>
			</div>
			<div className="mx-auto grid w-full max-w-(--container) gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-1">
				<p className="m-0 max-w-xl text-[1.05rem] leading-[1.65] font-semibold">
					Flemme looks at the whole kitchen—not just one ingredient. What’s in
					the cupboard, the tools you own, who’s eating, and what you actually
					like.
				</p>
				<p className="m-0 max-w-xl text-[1.05rem] leading-[1.65] font-semibold">
					Less deciding. Less waste. More dinners that make sense for real life.
				</p>
			</div>
		</section>
	);
}
