import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";

export function LandingNavbar() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header className="sticky inset-x-0 top-0 z-20 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
			<div className="mx-auto w-[min(calc(100%-1.5rem),var(--container))] py-3 lg:py-4">
				<nav
					className="grid min-h-14 grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]"
					aria-label="Main navigation"
				>
					{/* Desktop left navigation */}
					<div className="hidden items-center gap-10 text-sm font-medium lg:flex">
						<a href="#about">About</a>
						<a href="#discover">Discover</a>
						<a href="#pricing">Pricing</a>
					</div>

					{/* Brand */}
					<a className="no-underline" href="#top" aria-label="Flemme home">
						<BrandMark />
					</a>

					{/* Desktop CTA */}
					<div className="hidden justify-end lg:flex">
						<Button
							className="min-h-12 rounded-full border-0 px-7 text-cream! shadow-none"
							render={<Link to="/register" />}
						>
							Get Started
							<ArrowRight />
						</Button>
					</div>

					{/* Mobile menu trigger */}
					<Button
						className="justify-self-end rounded-full border-0 bg-foreground text-background shadow-none lg:hidden"
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

				{/* Mobile navigation */}
				{menuOpen ? (
					<nav
						id="mobile-menu"
						className="mt-3 grid gap-1 rounded-3xl border border-border bg-card p-3 shadow-card lg:hidden"
						aria-label="Mobile navigation"
					>
						<a
							className="flex min-h-12 items-center px-3 font-semibold"
							href="#about"
							onClick={() => setMenuOpen(false)}
						>
							About
						</a>

						<a
							className="flex min-h-12 items-center px-3 font-semibold"
							href="#discover"
							onClick={() => setMenuOpen(false)}
						>
							Discover
						</a>

						<a
							className="flex min-h-12 items-center px-3 font-semibold"
							href="#pricing"
							onClick={() => setMenuOpen(false)}
						>
							Pricing
						</a>

						<Link
							className="flex min-h-12 items-center px-3 font-semibold"
							to="/login"
							search={{ error: undefined }}
							onClick={() => setMenuOpen(false)}
						>
							Log in
						</Link>

						<Button
							className="mt-1 rounded-full text-cream!"
							render={<Link to="/register" />}
						>
							Get Started
							<ArrowRight />
						</Button>
					</nav>
				) : null}
			</div>
		</header>
	);
}
