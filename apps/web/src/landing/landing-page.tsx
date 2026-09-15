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
import { useState } from "react";

const recipeCards = [
	{ name: "Nasi goreng sayur", detail: "Quick · one pan", tone: "mustard" },
	{ name: "Ayam kecap", detail: "Comforting · savory", tone: "pink" },
	{ name: "Pasta sambal", detail: "Spicy · 25 min", tone: "lavender" },
];

const tickerStatements = [
	{ id: "question-a", text: "What’s in your fridge?" },
	{ id: "cook-a", text: "Let’s cook" },
	{ id: "decide-a", text: "No more “makan apa ya?”" },
	{ id: "use-a", text: "Cook what you have" },
	{ id: "question-b", text: "What’s in your fridge?" },
	{ id: "cook-b", text: "Let’s cook" },
	{ id: "decide-b", text: "No more “makan apa ya?”" },
	{ id: "use-b", text: "Cook what you have" },
];

const journey = [
	["01", "Tell us what you have", "Ingredients on hand, not a perfect pantry."],
	["02", "Pick a meal", "Choose the idea that sounds good tonight."],
	["03", "Prepare", "Get everything ready before the pan gets hot."],
	["04", "Cook together", "Follow one clear, useful step at a time."],
];

function BrandMark() {
	return (
		<span className="brand-mark">
			Flemme<span>.</span>
		</span>
	);
}

function LandingNavbar() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="landing-header">
			<nav className="landing-nav" aria-label="Main navigation">
				<div className="desktop-nav-links">
					<a href="#about">About</a>
					<a href="#discover">Discover</a>
					<a href="#pricing">Pricing</a>
				</div>
				<a href="#top" aria-label="Flemme home">
					<BrandMark />
				</a>
				<div className="desktop-nav-actions">
					<Link to="/login" search={{ error: undefined }}>
						Log in
					</Link>
					<Link to="/register" className="nav-cta">
						Get started <ArrowRight size={16} />
					</Link>
				</div>
				<button
					className="menu-button"
					type="button"
					aria-expanded={menuOpen}
					aria-controls="mobile-menu"
					onClick={() => setMenuOpen(!menuOpen)}
				>
					{menuOpen ? <X /> : <Menu />}
					<span>{menuOpen ? "Close" : "Menu"}</span>
				</button>
			</nav>
			{menuOpen && (
				<div className="mobile-menu" id="mobile-menu">
					<a href="#about">About</a>
					<a href="#discover">Discover</a>
					<a href="#pricing">Pricing</a>
					<Link to="/login" search={{ error: undefined }}>
						Log in
					</Link>
					<Link to="/register" className="primary-button">
						Get started <ArrowRight size={18} />
					</Link>
				</div>
			)}
		</header>
	);
}

function HeroVisual() {
	return (
		<div
			className="hero-visual"
			aria-label="A playful bowl filled with fresh ingredients"
			role="img"
		>
			<span className="hero-spark hero-spark-one">✦</span>
			<span className="hero-spark hero-spark-two">✦</span>
			<div className="ingredient ingredient-tomato">
				<span />
			</div>
			<div className="ingredient ingredient-egg">
				<span />
			</div>
			<div className="ingredient ingredient-leaf">⌁</div>
			<div className="ingredient ingredient-onion">◎</div>
			<div className="bowl-rim">
				<span>tonight's dinner</span>
			</div>
			<div className="bowl">
				<Flame aria-hidden="true" />
			</div>
			<p className="visual-note">
				made with what
				<br />
				you already have
			</p>
		</div>
	);
}

function HeroSection() {
	return (
		<section className="hero-section" id="top">
			<div className="hero-copy">
				<p className="section-kicker">Your everyday cooking companion</p>
				<h1>
					Buka kulkas,
					<br />
					<em>bukan</em>
					<br />
					kebingungan.
				</h1>
				<p className="hero-description">
					Tell Flemme what you have. We’ll figure out what you can cook—then
					cook it together, step by step.
				</p>
				<div className="hero-actions">
					<Link to="/register" className="primary-button">
						Start cooking <ArrowRight size={19} />
					</Link>
					<a href="#how-it-works" className="plain-link">
						See how it works <ChevronDown size={18} />
					</a>
				</div>
			</div>
			<HeroVisual />
		</section>
	);
}

function BrandTicker() {
	return (
		<section className="ticker" aria-label="Flemme values">
			<div className="ticker-track">
				{tickerStatements.map(({ id, text }) => (
					<span key={id}>
						{text} <b>✦</b>
					</span>
				))}
			</div>
		</section>
	);
}

function DiscoverSection() {
	return (
		<section className="landing-section discover-section" id="discover">
			<div className="section-heading discover-heading">
				<div>
					<p className="section-kicker">Discover</p>
					<h2>
						Good food is already <em>in there.</em>
					</h2>
				</div>
				<p>
					Recipes shaped around your ingredients, not another shopping list.
					Browse ideas, pick one, and make it yours.
				</p>
			</div>
			<div className="recipe-grid">
				{recipeCards.map((recipe, index) => (
					<article
						className={`recipe-card recipe-card-${index + 1} ${recipe.tone}`}
						key={recipe.name}
					>
						<div className="recipe-art" aria-hidden="true">
							<span />
							<span />
							<span />
						</div>
						<div>
							<p>{recipe.detail}</p>
							<h3>{recipe.name}</h3>
						</div>
						<button type="button" aria-label={`View ${recipe.name}`}>
							<ArrowRight />
						</button>
					</article>
				))}
			</div>
			<a className="underlined-link" href="#how-it-works">
				See what Flemme can do <ArrowRight size={18} />
			</a>
		</section>
	);
}

function AboutSection() {
	return (
		<section className="landing-section about-section" id="about">
			<div className="about-stamp">
				<span>
					USE WHAT
					<br />
					YOU HAVE
				</span>
				<Sparkles />
			</div>
			<div>
				<p className="section-kicker">About Flemme</p>
				<h2>
					Your fridge already has <em>ideas.</em>
				</h2>
			</div>
			<div className="about-copy">
				<p>
					Flemme looks at the whole kitchen—not just one ingredient. What’s in
					the cupboard, the tools you own, who’s eating, and what you actually
					like.
				</p>
				<p>
					Less deciding. Less waste. More dinners that make sense for real life.
				</p>
			</div>
		</section>
	);
}

function HowItWorksSection() {
	return (
		<section className="landing-section journey-section" id="how-it-works">
			<div className="section-heading">
				<div>
					<p className="section-kicker">How it works</p>
					<h2>
						From “what’s here?”
						<br />
						to <em>so good.</em>
					</h2>
				</div>
				<p>
					No chatbot maze. Just a clear path from a handful of ingredients to a
					finished plate.
				</p>
			</div>
			<div className="journey-list">
				{journey.map(([number, title, body]) => (
					<article key={number}>
						<span>{number}</span>
						<div>
							<h3>{title}</h3>
							<p>{body}</p>
						</div>
						<ArrowRight aria-hidden="true" />
					</article>
				))}
			</div>
		</section>
	);
}

function PersonalizationSection() {
	return (
		<section className="landing-section personalization-section">
			<div className="personalization-copy">
				<p className="section-kicker">Made for your kitchen</p>
				<h2>
					Your dinner.
					<br />
					<em>Your rules.</em>
				</h2>
				<p>Flemme remembers the context that makes a recipe useful to you.</p>
			</div>
			<div
				className="orbit-board"
				aria-label="Flemme personalizes recipes to your context"
				role="img"
			>
				<div className="orbit-center">
					<BrandMark />
					<small>makes it fit</small>
				</div>
				<span className="sticker sticker-one">Your ingredients</span>
				<span className="sticker sticker-two">Your taste</span>
				<span className="sticker sticker-three">Your kitchen</span>
				<span className="sticker sticker-four">Your household</span>
				<span className="sticker sticker-five">
					<Clock3 size={17} /> Your time
				</span>
			</div>
		</section>
	);
}

function PricingSection() {
	return (
		<section className="landing-section pricing-section" id="pricing">
			<div className="section-heading">
				<div>
					<p className="section-kicker">Pricing</p>
					<h2>Come cook with us.</h2>
				</div>
				<p>
					Flemme is currently in early access. Create an account and be among
					the first at the table.
				</p>
			</div>
			<div className="early-access-card">
				<div>
					<span className="accent-label">Early access</span>
					<h3>Your next dinner starts here.</h3>
					<p>
						Set up your taste, kitchen, household, and ingredients. Flemme will
						keep them ready for the meals ahead.
					</p>
				</div>
				<ul>
					<li>
						<Check /> Personal cooking context
					</li>
					<li>
						<Check /> Ideas from what you have
					</li>
					<li>
						<Check /> Guided cooking, step by step
					</li>
				</ul>
				<Link to="/register" className="primary-button">
					Get started <ArrowRight size={18} />
				</Link>
			</div>
		</section>
	);
}

function FinalCtaSection() {
	return (
		<section className="final-cta">
			<span className="final-doodle">✦</span>
			<p className="section-kicker">Dinner is waiting</p>
			<h2>
				Still wondering
				<br />
				what to cook?
			</h2>
			<p className="accent-script">Open your fridge.</p>
			<Link to="/register" className="primary-button cream-button">
				Let Flemme cook with you <ArrowRight size={19} />
			</Link>
		</section>
	);
}

function LandingFooter() {
	return (
		<footer className="landing-footer">
			<BrandMark />
			<p>Cook what you have. Make it yours.</p>
			<div>
				<a href="#about">About</a>
				<a href="#discover">Discover</a>
				<Link to="/login" search={{ error: undefined }}>
					Log in
				</Link>
			</div>
			<small>© {new Date().getFullYear()} Flemme</small>
		</footer>
	);
}

export function LandingPage() {
	return (
		<main className="landing-page">
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
