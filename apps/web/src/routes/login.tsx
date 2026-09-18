import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
			<form className="space-y-4" onSubmit={submit}>
				<label
					className="grid gap-2 text-sm font-extrabold"
					htmlFor="login-email"
				>
					Email
					<Input
						id="login-email"
						name="email"
						type="email"
						autoComplete="email"
						required
					/>
				</label>
				<label
					className="grid gap-2 text-sm font-extrabold"
					htmlFor="login-password"
				>
					Password
					<Input
						id="login-password"
						name="password"
						type="password"
						autoComplete="current-password"
						minLength={8}
						maxLength={128}
						required
					/>
				</label>
				{error ? (
					<p
						className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
						role="alert"
					>
						{error}
					</p>
				) : null}
				<Button
					className="w-full rounded-xl"
					type="submit"
					disabled={submitting}
				>
					{submitting ? "Signing in…" : "Sign in"}
				</Button>
				<div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
					<span>or</span>
				</div>
				<Button
					variant="outline"
					className="w-full rounded-xl border-transparent bg-muted shadow-none"
					type="button"
					disabled={submitting}
					onClick={continueWithGoogle}
				>
					<span
						className="grid size-6 place-items-center rounded-lg bg-lavender font-black"
						aria-hidden="true"
					>
						G
					</span>
					Continue with Google
				</Button>
			</form>
		</AuthShell>
	);
}
