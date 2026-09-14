import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";

export const Route = createFileRoute("/onboarding/household")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const decision = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"household",
		);
		if (target) {
			throw redirect({ to: target });
		}
	},
	component: OnboardingHouseholdPage,
});

function OnboardingHouseholdPage() {
	return (
		<OnboardingStepShell
			title="Set household size"
			description="Household setup is part of O3 and is not implemented in this pass."
		>
			<p>Waiting on household form build in the next onboarding task.</p>
		</OnboardingStepShell>
	);
}
