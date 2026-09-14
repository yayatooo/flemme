import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthActionError, signOut } from "../auth/auth-actions";
import { requireAuthenticatedUser } from "../auth/auth-guards";
import { useAuth } from "../auth/auth-query";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../onboarding/onboarding-query";

export const Route = createFileRoute("/app")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const onboarding = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			onboarding,
			location.pathname,
			"app",
		);
		if (target) {
			throw redirect({ to: target });
		}
	},
	component: UserPlatformPage,
});

function UserPlatformPage() {
	const auth = useAuth();
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
			<section className="welcome-card">
				<p className="eyebrow">Kitchen ready</p>
				<h1>What feels good to cook today?</h1>
				<p>
					Signed in as <strong>{auth.user?.email}</strong>. Your cooking
					workspace is ready for the next product flow.
				</p>
				{error ? (
					<p className="form-error" role="alert">
						{error}
					</p>
				) : null}
			</section>
		</main>
	);
}
