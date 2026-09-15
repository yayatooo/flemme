import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../onboarding/onboarding-query";

export const Route = createFileRoute("/onboarding")({
	validateSearch: (search: Record<string, unknown>): { edit?: boolean } =>
		search.edit === true || search.edit === "true" ? { edit: true } : {},
	beforeLoad: async ({ context, location, search }) => {
		await requireAuthenticatedUser(context.queryClient);
		const onboarding = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const completedEditor =
			location.pathname === "/onboarding/household" ||
			location.pathname === "/onboarding/kitchen";
		if (onboarding.completed && completedEditor && search.edit) return;
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
