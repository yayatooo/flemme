import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthActionError, signOut } from "../auth/auth-actions";
import { requireAuthenticatedUser } from "../auth/auth-guards";
import { useOnboardingDecision } from "../onboarding/onboarding-query";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: ({ context }) => requireAuthenticatedUser(context.queryClient),
	component: OnboardingPage,
});

function OnboardingPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const decision = useOnboardingDecision(queryClient);
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
				<h1>Let’s get your kitchen ready.</h1>
				{decision.isPending ? <p>Checking your setup…</p> : null}
				{decision.isError ? (
					<p className="form-error" role="alert">
						We could not check your kitchen setup. Please try again.
					</p>
				) : null}
				{decision.data?.required ? (
					<>
						<p>These Product Domain resources still need setup:</p>
						<ul className="missing-list">
							{decision.data.missing.map((resource) => (
								<li key={resource}>{resource}</li>
							))}
						</ul>
						<p className="shell-note">
							The setup forms belong to the next bounded User Platform work—not
							to authentication.
						</p>
					</>
				) : null}
				{decision.data && !decision.data.required ? (
					<Link className="primary-button" to="/app">
						Continue to Flemme
					</Link>
				) : null}
				{error ? (
					<p className="form-error" role="alert">
						{error}
					</p>
				) : null}
			</section>
		</main>
	);
}
