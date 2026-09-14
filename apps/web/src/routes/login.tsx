import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import {
	AuthActionError,
	signInWithEmail,
	signInWithGoogle,
} from "../auth/auth-actions";
import { redirectAuthenticatedUser } from "../auth/auth-guards";
import { AuthShell } from "../auth/auth-shell";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): { error?: string } => {
		const error = typeof search.error === "string" ? search.error : undefined;
		return error ? { error } : {};
	},
	beforeLoad: ({ context }) => redirectAuthenticatedUser(context.queryClient),
	component: LoginPage,
});

function LoginPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const search = Route.useSearch();
	const [error, setError] = useState<string | null>(
		search.error === "account_not_linked"
			? "This email is already registered with another sign-in method. Please sign in using your existing method."
			: null,
	);
	const [submitting, setSubmitting] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		const data = new FormData(event.currentTarget);
		try {
			await signInWithEmail(queryClient, {
				email: String(data.get("email") ?? "").trim(),
				password: String(data.get("password") ?? ""),
			});
			await navigate({ to: "/app" });
		} catch (cause) {
			setError(
				cause instanceof AuthActionError
					? cause.message
					: "Unable to sign in. Check your connection and try again.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function continueWithGoogle() {
		setSubmitting(true);
		setError(null);
		try {
			await signInWithGoogle();
		} catch (cause) {
			setError(
				cause instanceof AuthActionError
					? cause.message
					: "Unable to continue with Google. Please try again.",
			);
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Welcome back"
			title="What are we cooking?"
			description="Sign in to pick up your kitchen context and cooking sessions."
			footer={
				<p>
					New to Flemme? <Link to="/register">Create an account</Link>
				</p>
			}
		>
			<form className="auth-form" onSubmit={submit}>
				<label>
					Email
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					Password
					<input
						name="password"
						type="password"
						autoComplete="current-password"
						minLength={8}
						maxLength={128}
						required
					/>
				</label>
				{error ? (
					<p className="form-error" role="alert">
						{error}
					</p>
				) : null}
				<button className="primary-button" type="submit" disabled={submitting}>
					{submitting ? "Signing in…" : "Sign in"}
				</button>
				<div className="form-divider">
					<span>or</span>
				</div>
				<button
					className="google-button"
					type="button"
					disabled={submitting}
					onClick={continueWithGoogle}
				>
					<span aria-hidden="true">G</span>
					Continue with Google
				</button>
			</form>
		</AuthShell>
	);
}
