import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	completeOnboarding,
	completionErrorMessage,
} from "../../onboarding/completion-query";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";

export const Route = createFileRoute("/onboarding/complete")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const status = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			status,
			location.pathname,
			"complete",
		);
		if (target) throw redirect({ to: target });
	},
	component: OnboardingCompletionPage,
});

function OnboardingCompletionPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const submitLock = useRef(false);
	const [error, setError] = useState<string | null>(null);
	const completion = useMutation({
		mutationFn: () => completeOnboarding(queryClient),
	});

	const startCooking = async () => {
		if (submitLock.current) return;
		submitLock.current = true;
		setError(null);
		try {
			const target = await completion.mutateAsync();
			await navigate({ to: target, replace: true });
		} catch (cause) {
			setError(completionErrorMessage(cause));
		} finally {
			submitLock.current = false;
		}
	};

	return (
		<OnboardingStepShell
			eyebrow="Setup complete"
			title="You're all set"
			description="Flemme is ready to help you cook with the context you've shared. You can update your setup anytime."
		>
			<div className="space-y-5">
				<div
					className="flex size-16 items-center justify-center rounded-2xl bg-secondary shadow-control"
					aria-hidden="true"
				>
					<Check className="size-8 stroke-[3]" />
				</div>
				<Button
					type="button"
					className="w-full rounded-xl"
					disabled={completion.isPending}
					onClick={() => void startCooking()}
				>
					{completion.isPending
						? "Finishing setup…"
						: error
							? "Try Again"
							: "Start Cooking"}
				</Button>
				{error ? (
					<p
						className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
						role="alert"
					>
						{error}
					</p>
				) : null}
			</div>
		</OnboardingStepShell>
	);
}
