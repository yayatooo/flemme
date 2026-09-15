import { Link } from "@tanstack/react-router";
import { BrandMark } from "./brand-mark";

export function LandingFooter() {
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
