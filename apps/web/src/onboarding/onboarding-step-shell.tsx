import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { AuthActionError, signOut } from "../auth/auth-actions";

interface OnboardingStepShellProps {
	title: string;
	description: string;
	children: ReactNode;
}

export function OnboardingStepShell({
	title,
	description,
	children,
}: OnboardingStepShellProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	async function logout() {
		setError(null);
		try {
			await signOut(queryClient);
			await navigate({ to: "/login", search: { error: undefined } });
		} catch (cause) {
			setError(
				cause instanceof AuthActionError
					? cause.message
					: "Unable to sign out. Please try again.",
			);
		}
	}

	return (
		<main className="platform-page">
			<header className="platform-header">
				<span className="brand-mark">Flemme</span>
				<button type="button" className="text-button" onClick={logout}>
					Sign out
				</button>
			</header>
			<section className="welcome-card onboarding-card">
				<p className="eyebrow">First, your cooking context</p>
				<h1>{title}</h1>
				<p className="shell-note">{description}</p>
				{children}
				{error ? (
					<p className="form-error" role="alert">
						{error}
					</p>
				) : null}
			</section>
		</main>
	);
}
