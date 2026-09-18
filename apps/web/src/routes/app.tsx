import {
	createFileRoute,
	Outlet,
	redirect,
	useRouterState,
} from "@tanstack/react-router";
import { AppHeader, AppShell, BottomNavigation } from "@/components/app";
import { requireAuthenticatedUser } from "../auth/auth-guards";
import { useAuth } from "../auth/auth-query";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../onboarding/onboarding-query";

export const Route = createFileRoute("/app")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const onboarding = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			onboarding,
			location.pathname,
			"app",
		);
		if (target) {
			throw redirect({ to: target });
		}
	},
	component: AppLayout,
});

function AppLayout() {
	const auth = useAuth();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isCooking = pathname.startsWith("/app/cooking/");
	const hideBottomNavigation =
		isCooking ||
		pathname.startsWith("/app/recommendation") ||
		pathname.startsWith("/app/pre-cooking");

	return (
		<AppShell hasBottomNavigation={!hideBottomNavigation}>
			{isCooking ? null : <AppHeader user={auth.user} />}
			<main className="flex-1">
				<Outlet />
			</main>
			{hideBottomNavigation ? null : <BottomNavigation />}
		</AppShell>
	);
}
