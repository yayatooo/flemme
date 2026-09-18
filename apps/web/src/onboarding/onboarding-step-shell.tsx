import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthActionError, signOut } from "../auth/auth-actions";

interface OnboardingStepShellProps {
	eyebrow?: string;
	title: string;
	description: string;
	children: ReactNode;
}

export function OnboardingStepShell({
	eyebrow = "First, your cooking context",
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
		<main
			data-theme="platform"
			className="min-h-dvh bg-background px-4 py-[max(1rem,env(safe-area-inset-top))] text-foreground sm:px-6 sm:py-6"
		>
			<div className="mx-auto w-full max-w-xl space-y-3">
				<header className="grid grid-cols-[1fr_auto] items-stretch gap-3">
					<span className="flex min-h-14 items-center rounded-2xl bg-card px-4 font-heading text-2xl tracking-tight shadow-control">
						Flemme<span className="text-primary">.</span>
					</span>
					<Button
						type="button"
						variant="ghost"
						className="min-h-14 rounded-2xl border-transparent bg-soft-pink px-4 shadow-control hover:border-transparent hover:bg-soft-pink/85"
						onClick={logout}
					>
						Sign out
					</Button>
				</header>
				<Card className="gap-0 border-transparent py-0 shadow-card">
					<CardHeader className="m-4 mb-0 space-y-2 rounded-2xl bg-mustard p-5">
						<p className="text-[0.6875rem] font-extrabold tracking-[0.16em] uppercase">
							{eyebrow}
						</p>
						<h1 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
							{title}
						</h1>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{description}
						</p>
					</CardHeader>
					<CardContent className="space-y-5 p-5">
						{children}
						{error ? (
							<p
								className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
								role="alert"
							>
								{error}
							</p>
						) : null}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
