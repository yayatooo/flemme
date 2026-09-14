import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<main className="landing-page">
			<nav className="landing-nav">
				<span className="brand-mark">Flemme</span>
				<Link to="/login" search={{ error: undefined }} className="text-link">
					Sign in
				</Link>
			</nav>
			<section className="landing-hero">
				<p className="eyebrow">Your everyday cooking companion</p>
				<h1>Cook what you have, make it yours.</h1>
				<p>
					Flemme turns your ingredients, kitchen, and household context into a
					practical next meal.
				</p>
				<div className="landing-actions">
					<Link to="/register" className="primary-button">
						Get started
					</Link>
					<Link
						to="/login"
						search={{ error: undefined }}
						className="secondary-button"
					>
						I already have an account
					</Link>
				</div>
			</section>
		</main>
	);
}
