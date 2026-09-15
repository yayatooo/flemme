import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	ChevronDown,
	Clock3,
	Flame,
	Menu,
	Sparkles,
	X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const recipeCards = [
	{
		name: "Nasi goreng sayur",
		detail: "Quick · one pan",
		surface: "bg-card shadow-hard-lg",
		art: "bg-mustard",
		featured: true,
	},
	{
		name: "Ayam kecap",
		detail: "Comforting · savory",
		surface: "bg-soft-pink",
		art: "bg-soft-pink",
		featured: false,
	},
	{
		name: "Pasta sambal",
		detail: "Spicy · 25 min",
		surface: "bg-card shadow-hard",
		art: "bg-lavender",
		featured: false,
	},
] as const;

const tickerStatements = [
	{ id: "question-a", text: "What’s in your fridge?" },
	{ id: "cook-a", text: "Let’s cook" },
	{ id: "decide-a", text: "No more “makan apa ya?”" },
	{ id: "use-a", text: "Cook what you have" },
	{ id: "question-b", text: "What’s in your fridge?" },
	{ id: "cook-b", text: "Let’s cook" },
	{ id: "decide-b", text: "No more “makan apa ya?”" },
	{ id: "use-b", text: "Cook what you have" },
] as const;

const journey = [
	["01", "Tell us what you have", "Ingredients on hand, not a perfect pantry."],
	["02", "Pick a meal", "Choose the idea that sounds good tonight."],
	["03", "Prepare", "Get everything ready before the pan gets hot."],
	["04", "Cook together", "Follow one clear, useful step at a time."],
] as const;

const kickerClass =
	"m-0 text-xs font-extrabold tracking-[0.16em] text-foreground uppercase";
const headingClass =
	"mt-2.5 font-heading text-[clamp(2.7rem,12vw,5.4rem)] leading-[0.98] font-normal tracking-[-0.045em]";
const sectionClass =
	"mx-auto w-full max-w-[var(--container)] px-5 py-24 lg:px-8 lg:py-32";
const groovyAccentClass =
	"font-['Shrikhand'] font-normal text-primary not-italic";

function BrandMark() {
	return (
		<span className="font-heading text-2xl leading-none tracking-[-0.035em] text-foreground">
			Flemme<span className="text-primary">.</span>
		</span>
	);
}

function LandingNavbar() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="absolute inset-x-0 top-0 z-20 mx-auto mt-3 w-[min(calc(100%-1.5rem),var(--container))] lg:mt-5">
			<nav
				className="grid min-h-[4.2rem] grid-cols-[1fr_auto] items-center rounded-full border-[3px] border-foreground bg-background/95 py-2.5 pr-2.5 pl-5 shadow-hard backdrop-blur-sm lg:min-h-[4.7rem] lg:grid-cols-[1fr_auto_1fr] lg:px-4"
				aria-label="Main navigation"
			>
				<div className="hidden items-center gap-7 text-xs font-extrabold lg:flex">
					<a href="#about">About</a>
					<a href="#discover">Discover</a>
					<a href="#pricing">Pricing</a>
				</div>
				<a className="no-underline" href="#top" aria-label="Flemme home">
					<BrandMark />
				</a>
				<div className="hidden items-center justify-end gap-7 text-xs font-extrabold lg:flex">
					<Link to="/login" search={{ error: undefined }}>
						Log in
					</Link>
					<Button size="sm" render={<Link to="/register" />}>
						Get started <ArrowRight />
					</Button>
				</div>
				<Button
					className="justify-self-end border-transparent bg-foreground text-background shadow-none lg:hidden"
					size="sm"
					type="button"
					aria-expanded={menuOpen}
					aria-controls="mobile-menu"
					onClick={() => setMenuOpen((open) => !open)}
				>
					{menuOpen ? <X /> : <Menu />}
					<span>{menuOpen ? "Close" : "Menu"}</span>
				</Button>
			</nav>
			{menuOpen ? (
				<nav
					className="mt-2 grid gap-1 rounded-3xl border-[3px] border-foreground bg-background p-3 shadow-hard"
					id="mobile-menu"
					aria-label="Mobile navigation"
				>
					<a
						className="flex min-h-12 items-center px-3 font-extrabold"
						href="#about"
					>
						About
					</a>
					<a
						className="flex min-h-12 items-center px-3 font-extrabold"
						href="#discover"
					>
						Discover
					</a>
					<a
						className="flex min-h-12 items-center px-3 font-extrabold"
						href="#pricing"
					>
						Pricing
					</a>
					<Link
						className="flex min-h-12 items-center px-3 font-extrabold"
						to="/login"
						search={{ error: undefined }}
					>
						Log in
					</Link>
					<Button className="mt-1" render={<Link to="/register" />}>
						Get started <ArrowRight />
					</Button>
				</nav>
			) : null}
		</header>
	);
}

function HeroVisual() {
	return (
		<div
			className="relative isolate min-h-25rem before:absolute before:inset-[4%_4%_4%_3%] before:-z-20 before:rotate-3 before:rounded-[48%_52%_45%_55%/53%_44%_56%_47%] before:border-[3px] before:border-foreground before:bg-mustard before:shadow-hard-lg before:content-[''] after:absolute after:top-[9%] after:right-[10%] after:-z-10 after:size-22 after:rounded-full after:border-[3px] after:border-foreground after:bg-lavender after:content-[''] lg:min-h-144"
			aria-label="A playful bowl filled with fresh ingredients"
			role="img"
		>
			<span className="absolute top-[15%] right-[7%] text-3xl">✦</span>
			<span className="absolute bottom-[13%] left-[8%] text-3xl">✦</span>
			<div className="absolute top-[24%] left-[22%] z-3 grid size-[5.6rem] place-items-center rounded-full border-[3px] border-foreground bg-tomato">
				<span className="absolute -top-5 h-8 w-11 bg-secondary [clip-path:polygon(50%_45%,100%_0,75%_55%,100%_100%,51%_75%,0_100%,27%_53%,0_0)]" />
			</div>
			<div className="absolute top-1/4 right-[18%] z-3 grid h-[5.6rem] w-28 rotate-14deg place-items-center rounded-[48%_52%_50%_46%] border-[3px] border-foreground bg-card">
				<span className="size-11 rounded-full border-2 border-foreground bg-mustard" />
			</div>
			<div className="absolute top-[11%] left-[45%] z-3 grid h-28 w-16 rotate-12 place-items-center rounded-[100%_0_100%_0] border-[3px] border-foreground bg-secondary text-5xl">
				⌁
			</div>
			<div className="absolute top-[17%] left-[9%] z-3 grid size-[3.8rem] -rotate-12 place-items-center rounded-[50%_50%_48%_48%] border-[3px] border-foreground bg-soft-pink text-3xl">
				◎
			</div>
			<div className="absolute top-[41%] left-[11%] z-5 grid h-[5.2rem] w-[78%] -rotate-3 place-items-center rounded-[50%] border-[3px] border-foreground bg-background before:absolute before:inset-[0.75rem_1rem] before:rounded-[50%] before:border-2 before:border-foreground before:bg-primary before:content-['']">
				<span className="z-1 rounded-full bg-background px-2.5 py-1 text-[0.62rem] font-black tracking-widest uppercase">
					tonight's dinner
				</span>
			</div>
			<div className="absolute top-[49%] left-[17%] z-4 grid h-38 w-[66%] -rotate-3 place-items-end overflow-hidden rounded-[0_0_48%_48%/0_0_90%_90%] border-[3px] border-foreground bg-primary">
				<Flame
					className="mb-6 size-12 stroke-[2.5] text-background"
					aria-hidden="true"
				/>
			</div>
			<p className="absolute right-[4%] bottom-[4%] m-0 rotate-[7deg] font-['Shrikhand'] text-sm leading-[1.1]">
				made with what
				<br />
				you already have
			</p>
		</div>
	);
}

function HeroSection() {
	return (
		<section
			className="mx-auto grid min-h-svh w-full max-w-var(--container) items-center gap-12 px-5 pt-32 pb-16 lg:grid-cols-[minmax(0,1.04fr)_minmax(28rem,0.96fr)] lg:gap-16 lg:px-8 lg:pt-36 lg:pb-20"
			id="top"
		>
			<div className="relative z-2">
				<p className={kickerClass}>Your everyday cooking companion</p>
				<h1 className="mt-3.5 max-w-[9ch] font-heading text-[clamp(3.5rem,17vw,6rem)] leading-[0.88] font-normal tracking-[-0.045em] lg:text-[clamp(5.2rem,7.3vw,7.2rem)]">
					Buka kulkas,
					<br />
					<em className={groovyAccentClass}>bukan</em>
					<br />
					kebingungan.
				</h1>
				<p className="mt-6 max-w-lg text-base leading-[1.65] text-muted-foreground lg:text-[1.08rem]">
					Tell Flemme what you have. We’ll figure out what you can cook—then
					cook it together, step by step.
				</p>
				<div className="mt-7 grid gap-4 sm:flex sm:items-center">
					<Button size="lg" render={<Link to="/register" />}>
						Start cooking <ArrowRight />
					</Button>
					<Button variant="link" size="lg" render={<a href="#how-it-works" />}>
						See how it works <ChevronDown />
					</Button>
				</div>
			</div>
			<HeroVisual />
		</section>
	);
}

function BrandTicker() {
	return (
		<section
			className="scale-[1.02] -rotate-1 overflow-hidden border-y-[3px] border-foreground bg-primary"
			aria-label="Flemme values"
		>
			<div className="flex w-max animate-marquee motion-reduce:animate-none">
				{tickerStatements.map(({ id, text }) => (
					<span
						className="py-3.5 pl-6 text-xs font-black tracking-widest whitespace-nowrap text-background uppercase"
						key={id}
					>
						{text} <b className="ml-6 text-foreground">✦</b>
					</span>
				))}
			</div>
		</section>
	);
}

function SectionHeading({
	kicker,
	children,
	description,
}: {
	kicker: string;
	children: ReactNode;
	description: string;
}) {
	return (
		<div className="mb-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20">
			<div>
				<p className={kickerClass}>{kicker}</p>
				<h2 className={headingClass}>{children}</h2>
			</div>
			<p className="m-0 max-w-lg leading-[1.7] text-muted-foreground">
				{description}
			</p>
		</div>
	);
}

function RecipeArt({ tone }: { tone: string }) {
	return (
		<div
			className={`relative block h-26 overflow-hidden rounded-3xl border-2 border-foreground ${tone}`}
			aria-hidden="true"
		>
			<span className="absolute right-[13%] bottom-[13%] block size-[58%] rounded-full border-2 border-foreground bg-background" />
			<span className="absolute right-[28%] bottom-[28%] block size-[28%] rounded-full border-2 border-foreground bg-primary" />
			<span className="absolute top-[8%] left-[13%] block h-[46%] w-[28%] rotate-[-18deg] rounded-[100%_0] border-2 border-foreground bg-secondary" />
		</div>
	);
}

function DiscoverSection() {
	return (
		<section className={`${sectionClass} pt-28`} id="discover">
			<SectionHeading
				kicker="Discover"
				description="Recipes shaped around your ingredients, not another shopping list. Browse ideas, pick one, and make it yours."
			>
				Good food is already <em className={groovyAccentClass}>in there.</em>
			</SectionHeading>
			<div className="grid gap-5 sm:grid-cols-2 sm:items-start lg:grid-cols-[0.9fr_1.2fr] lg:gap-8">
				{recipeCards.map((recipe, index) => (
					<Card
						className={`relative grid min-h-36 grid-cols-[6.5rem_1fr_auto] items-center gap-4 p-4 py-4 transition-transform motion-reduce:transition-none lg:hover:-translate-y-1.5 ${
							recipe.featured
								? "sm:row-span-2 sm:min-h-92 sm:grid-cols-1 sm:content-between"
								: "lg:min-h-48"
						} ${index === 2 ? "sm:col-start-2" : ""} ${recipe.surface}`}
						key={recipe.name}
					>
						<RecipeArt
							tone={`${recipe.art} ${recipe.featured ? "sm:h-52" : ""}`}
						/>
						<div>
							<p className="mb-1 text-[0.68rem] font-extrabold tracking-[0.08em] uppercase">
								{recipe.detail}
							</p>
							<h3 className="font-heading text-xl leading-[1.05] font-normal">
								{recipe.name}
							</h3>
						</div>
						<Button
							className="bg-foreground text-background shadow-none"
							size="icon-sm"
							type="button"
							aria-label={`View ${recipe.name}`}
						>
							<ArrowRight />
						</Button>
					</Card>
				))}
			</div>
			<Button
				className="mt-10 w-max"
				variant="link"
				render={<a href="#how-it-works" />}
			>
				See what Flemme can do <ArrowRight />
			</Button>
		</section>
	);
}

function AboutSection() {
	return (
		<section
			className="relative grid gap-10 border-y-[3px] border-foreground bg-primary px-5 py-24 lg:grid-cols-[minmax(12rem,0.45fr)_minmax(24rem,1fr)_minmax(20rem,0.8fr)] lg:items-center lg:px-[max(2rem,calc((100vw-var(--container))/2))] lg:py-32"
			id="about"
		>
			<div className="hidden size-40 -rotate-6 place-items-center rounded-full border-[3px] border-foreground bg-mustard text-center text-xs leading-[1.4] font-black tracking-[0.08em] shadow-hard lg:grid">
				<span>
					USE WHAT
					<br />
					YOU HAVE
				</span>
				<Sparkles className="size-6" />
			</div>
			<div className="mx-auto w-full max-w-var(--container) lg:w-auto">
				<p className={kickerClass}>About Flemme</p>
				<h2 className={headingClass}>
					Your fridge already has{" "}
					<em className={`${groovyAccentClass} text-background!`}>ideas.</em>
				</h2>
			</div>
			<div className="mx-auto grid w-full max-w-var(--container) gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-1">
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

function HowItWorksSection() {
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
			<div className="border-t-2 border-foreground lg:grid lg:grid-cols-4 lg:border-b-2">
				{journey.map(([number, title, body], index) => (
					<article
						className={`grid min-h-24 grid-cols-[3rem_1fr_auto] items-center gap-4 border-b-2 border-foreground py-6 lg:min-h-68 lg:grid-cols-1 lg:content-start lg:border-r-2 lg:border-b-0 lg:p-7 ${index === 0 ? "lg:pl-0" : ""} ${index === journey.length - 1 ? "lg:border-r-0" : ""}`}
						key={number}
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
				))}
			</div>
		</section>
	);
}

function PersonalizationSection() {
	const stickerClass =
		"absolute inline-flex items-center gap-1.5 rounded-full border-[3px] border-foreground bg-background px-3 py-2 text-xs font-extrabold shadow-[3px_3px_0_var(--ink)]";
	return (
		<section className="grid gap-12 border-y-[3px] border-foreground bg-lavender px-5 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-[max(2rem,calc((100vw-var(--container))/2))] lg:py-32">
			<div className="mx-auto w-full max-w-`var(--container)] lg:w-auto">
				<p className={kickerClass}>Made for your kitchen</p>
				<h2 className={headingClass}>
					Your dinner.
					<br />
					<em className={groovyAccentClass}>Your rules.</em>
				</h2>
				<p className="max-w-md leading-[1.6]">
					Flemme remembers the context that makes a recipe useful to you.
				</p>
			</div>
			<div
				className="relative mx-auto min-h-100 w-full max-w-var(--container) rounded-[50%] border-2 border-dashed border-foreground lg:min-h-132 lg:w-auto"
				aria-label="Flemme personalizes recipes to your context"
				role="img"
			>
				<div className="absolute top-1/2 left-1/2 grid size-40 -translate-1/2 place-items-center content-center rounded-full border-[3px] border-foreground bg-primary shadow-hard">
					<BrandMark />
					<small className="mt-1 font-extrabold">makes it fit</small>
				</div>
				<span className={`${stickerClass} top-[8%] left-[12%] -rotate-3`}>
					Your ingredients
				</span>
				<span
					className={`${stickerClass} top-[15%] right-[5%] rotate-3 bg-soft-pink`}
				>
					Your taste
				</span>
				<span
					className={`${stickerClass} bottom-[18%] left-[1%] rotate-3 bg-secondary`}
				>
					Your kitchen
				</span>
				<span
					className={`${stickerClass} right-0 bottom-[8%] -rotate-3 bg-mustard`}
				>
					Your household
				</span>
				<span className={`${stickerClass} top-[47%] left-0`}>
					<Clock3 /> Your time
				</span>
			</div>
		</section>
	);
}

function PricingSection() {
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

function FinalCtaSection() {
	return (
		<section className="relative grid justify-items-center overflow-hidden bg-foreground px-5 py-24 text-center text-background">
			<span className="absolute top-[10%] right-[8%] rotate-[14] text-5xl text-secondary">
				✦
			</span>
			<p className={`${kickerClass} text-mustard!`}>Dinner is waiting</p>
			<h2 className="mt-3 font-heading text-[clamp(3.1rem,14vw,7rem)] leading-[0.9] font-normal tracking-[-0.045em]">
				Still wondering
				<br />
				what to cook?
			</h2>
			<p className="my-3 mb-8 -rotate-3 font-['Shrikhand'] text-[clamp(2rem,9vw,4.5rem)] text-primary">
				Open your fridge.
			</p>
			<Button
				className="bg-background shadow-[5px_5px_0_var(--orange)]"
				size="lg"
				render={<Link to="/register" />}
			>
				Let Flemme cook with you <ArrowRight />
			</Button>
		</section>
	);
}

function LandingFooter() {
	return (
		<footer className="grid gap-6 px-5 py-12 text-center lg:grid-cols-[auto_1fr_auto_auto] lg:items-center lg:px-[max(2rem,calc((100vw-var(--container))/2))] lg:text-left">
			<BrandMark />
			<p className="m-0 text-muted-foreground">
				Cook what you have. Make it yours.
			</p>
			<div className="flex justify-center gap-5 font-bold lg:justify-start">
				<a href="#about">About</a>
				<a href="#discover">Discover</a>
				<Link to="/login" search={{ error: undefined }}>
					Log in
				</Link>
			</div>
			<small className="text-muted-foreground">
				© {new Date().getFullYear()} Flemme
			</small>
		</footer>
	);
}

export function LandingPage() {
	return (
		<main className="overflow-hidden bg-background">
			<LandingNavbar />
			<HeroSection />
			<BrandTicker />
			<DiscoverSection />
			<AboutSection />
			<HowItWorksSection />
			<PersonalizationSection />
			<PricingSection />
			<FinalCtaSection />
			<LandingFooter />
		</main>
	);
}
