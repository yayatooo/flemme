import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";

export const Route = createFileRoute("/onboarding/kitchen")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const decision = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"kitchen",
		);
		if (target) {
			throw redirect({ to: target });
		}
	},
	component: OnboardingKitchenPage,
});

function OnboardingKitchenPage() {
	return (
		<OnboardingStepShell
			title="Configure equipment"
			description="Kitchen setup is part of O4 and is not implemented in this pass."
		>
			<p>
				Waiting on kitchen equipment form build in the next onboarding task.
			</p>
		</OnboardingStepShell>
	);
}
