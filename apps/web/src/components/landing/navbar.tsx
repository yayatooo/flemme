import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";

export function LandingNavbar() {
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
