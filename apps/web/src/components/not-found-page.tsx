import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { BrandMark } from "@/components/landing/brand-mark";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
	return (
		<main
			data-theme="platform"
			className="min-h-svh overflow-hidden bg-background text-foreground"
		>
			<div className="mx-auto flex min-h-svh w-[min(calc(100%-1.5rem),var(--container))] flex-col py-4 sm:w-[min(calc(100%-3rem),var(--container))] sm:py-6">
				<header className="flex items-center justify-between">
					<Link className="no-underline" to="/" aria-label="Flemme home">
						<BrandMark />
					</Link>

					<span className="rounded-full bg-card px-4 py-2 text-xs font-extrabold tracking-[0.12em] uppercase shadow-control">
						Page not found
					</span>
				</header>

				<section className="flex flex-1 flex-col items-center justify-center py-8 sm:py-10 lg:py-12">
					<img
						className="max-h-[52svh] w-full max-w-4xl object-contain"
						src="/not-found.png"
						alt="Flemme's otter chef searching through a playful 404"
					/>

					<div className="mt-3 grid w-full max-w-3xl gap-6 border-t border-border/35 pt-6 sm:mt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10 sm:pt-8">
						<div className="max-w-xl">
							<p className="mb-2 text-xs font-extrabold tracking-[0.16em] text-primary uppercase">
								404 · Wrong turn
							</p>
							<h1 className="font-heading text-3xl leading-[1.05] font-semibold tracking-[-0.045em] sm:text-4xl">
								This page isn&apos;t on the menu.
							</h1>
							<p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
								The link may be out of date, or this page may have moved.
								Let&apos;s get you back to something delicious.
							</p>
						</div>

						<Button
							className="w-full text-cream! sm:w-auto"
							size="lg"
							render={<Link to="/" />}
						>
							Back to home
							<ArrowRight aria-hidden="true" />
						</Button>
					</div>
				</section>
			</div>
		</main>
	);
}
