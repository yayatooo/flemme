import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";

export const Route = createFileRoute("/onboarding/inventory")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const decision = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"inventory",
		);
		if (target) {
			throw redirect({ to: target });
		}
	},
	component: OnboardingInventoryPage,
});

function OnboardingInventoryPage() {
	return (
		<OnboardingStepShell
			title="Prepare initial inventory"
			description="Initial inventory setup is part of O5 and is not implemented in this pass."
		>
			<p>
				Waiting on initial inventory form build in the next onboarding task.
			</p>
		</OnboardingStepShell>
	);
}
