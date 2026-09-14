import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { AuthActionError, registerWithEmail } from "../auth/auth-actions";
import { redirectAuthenticatedUser } from "../auth/auth-guards";
import { AuthShell } from "../auth/auth-shell";

export const Route = createFileRoute("/register")({
	beforeLoad: ({ context }) => redirectAuthenticatedUser(context.queryClient),
	component: RegisterPage,
});

function RegisterPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		const data = new FormData(event.currentTarget);
		try {
			await registerWithEmail(queryClient, {
				name: String(data.get("name") ?? "").trim(),
				email: String(data.get("email") ?? "").trim(),
				password: String(data.get("password") ?? ""),
			});
			await navigate({ to: "/app" });
		} catch (cause) {
			setError(
				cause instanceof AuthActionError
					? cause.message
					: "Unable to register. Check your connection and try again.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AuthShell
			eyebrow="Join Flemme"
			title="Set up your kitchen companion"
			description="Create your identity now. Your cooking profile stays separate and comes next."
			footer={
				<p>
					Already registered?{" "}
					<Link to="/login" search={{ error: undefined }}>
						Sign in
					</Link>
				</p>
			}
		>
			<form className="auth-form" onSubmit={submit}>
				<label>
					Name
					<input name="name" autoComplete="name" required />
				</label>
				<label>
					Email
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					Password
					<input
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={8}
						maxLength={128}
						aria-describedby="password-help"
						required
					/>
				</label>
				<p id="password-help" className="field-help">
					8–128 characters
				</p>
				{error ? (
					<p className="form-error" role="alert">
						{error}
					</p>
				) : null}
				<button className="primary-button" type="submit" disabled={submitting}>
					{submitting ? "Creating account…" : "Create account"}
				</button>
			</form>
		</AuthShell>
	);
}
