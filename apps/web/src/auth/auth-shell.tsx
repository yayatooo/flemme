import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AuthShell({
	eyebrow,
	title,
	description,
	children,
	footer,
}: {
	eyebrow: string;
	title: string;
	description: string;
	children: ReactNode;
	footer: ReactNode;
}) {
	return (
		<main
			data-theme="platform"
			className="grid min-h-dvh place-items-center bg-background px-4 py-[max(1rem,env(safe-area-inset-top))] text-foreground sm:px-6"
		>
			<div className="w-full max-w-md space-y-3">
				<Link
					to="/"
					className="flex min-h-14 items-center rounded-2xl bg-card px-4 font-heading text-2xl tracking-tight no-underline shadow-control outline-none focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label="Flemme home"
				>
					Flemme<span className="text-primary">.</span>
				</Link>
				<Card className="gap-0 border-transparent py-0 shadow-card">
					<CardHeader className="m-4 mb-0 space-y-2 rounded-2xl bg-lavender p-5">
						<p className="text-[0.6875rem] font-extrabold tracking-[0.16em] uppercase">
							{eyebrow}
						</p>
						<h1 className="max-w-sm font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
							{title}
						</h1>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{description}
						</p>
					</CardHeader>
					<CardContent className="space-y-5 p-5">
						{children}
						<footer className="text-center text-sm text-muted-foreground [&_a]:font-bold [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline">
							{footer}
						</footer>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

export function SessionLoading() {
	return (
		<main
			data-theme="platform"
			className="grid min-h-dvh place-items-center bg-background p-4 text-foreground"
			aria-live="polite"
		>
			<div className="grid justify-items-center gap-4 rounded-3xl bg-card p-6 shadow-card">
				<div
					className="grid size-14 place-items-center rounded-2xl bg-primary font-heading text-2xl"
					aria-hidden="true"
				>
					F
				</div>
				<p className="font-bold text-muted-foreground">
					Warming up your kitchen…
				</p>
			</div>
		</main>
	);
}
