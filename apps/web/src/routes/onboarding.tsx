import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../onboarding/onboarding-query";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const onboarding = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			onboarding,
			location.pathname,
			"onboarding",
		);
		if (target) {
			throw redirect({ to: target });
		}
	},
	component: OnboardingRoot,
});

function OnboardingRoot() {
	return <Outlet />;
}
