import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

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
		<main className="auth-page">
			<Link to="/" className="brand-mark" aria-label="Flemme home">
				Flemme
			</Link>
			<section className="auth-card">
				<p className="eyebrow">{eyebrow}</p>
				<h1>{title}</h1>
				<p className="auth-description">{description}</p>
				{children}
				<div className="auth-footer">{footer}</div>
			</section>
		</main>
	);
}

export function SessionLoading() {
	return (
		<main className="loading-page" aria-live="polite">
			<div className="loading-mark" aria-hidden="true">
				F
			</div>
			<p>Warming up your kitchen…</p>
		</main>
	);
}
