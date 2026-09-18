import { Link } from "@tanstack/react-router";

import { BrandMark } from "./brand-mark";

const footerLinkClass = `
	text-sm
	font-semibold
	text-foreground/70
	transition-colors
	hover:text-foreground
	focus-visible:outline-none
	focus-visible:ring-2
	focus-visible:ring-ring
	focus-visible:ring-offset-4
`;

export function LandingFooter() {
	return (
		<footer className="border-t border-border bg-background">
			<div className="container mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
				<div
					className="
						grid
						gap-10
						py-10
						sm:py-12
						lg:grid-cols-[1fr_auto]
						lg:items-start
						lg:py-14
					"
				>
					{/* Brand */}
					<div className="max-w-sm">
						<a
							href="#top"
							className="inline-flex no-underline"
							aria-label="Flemme home"
						>
							<BrandMark />
						</a>

						<p
							className="
								mt-4
								mb-0
								max-w-xs
								text-sm
								leading-6
								text-muted-foreground
							"
						>
							Cook what you have.
							<br />
							Make it yours.
						</p>
					</div>

					{/* Navigation */}
					<nav
						className="
							grid
							grid-cols-2
							gap-x-10
							gap-y-4
							sm:flex
							sm:flex-wrap
							sm:items-center
							sm:gap-8
						"
						aria-label="Footer navigation"
					>
						<a className={footerLinkClass} href="#about">
							About
						</a>

						<a className={footerLinkClass} href="#discover">
							Discover
						</a>

						<a className={footerLinkClass} href="#pricing">
							Pricing
						</a>

						<Link
							className={footerLinkClass}
							to="/login"
							search={{ error: undefined }}
						>
							Log in
						</Link>
					</nav>
				</div>

				{/* Bottom bar */}
				<div
					className="
						flex
						flex-col
						gap-3
						border-t
						border-border
						py-5
						text-xs
						text-muted-foreground
						sm:flex-row
						sm:items-center
						sm:justify-between
					"
				>
					<small>
						© {new Date().getFullYear()} Flemme. All rights reserved.
					</small>

					<p className="m-0 text-xs font-semibold tracking-[0.06em]">
						Good food. Less overthinking.
					</p>
				</div>
			</div>
		</footer>
	);
}
