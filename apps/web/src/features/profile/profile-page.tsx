import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/auth-query";
import { PageContainer } from "@/components/app";
import { householdQueryOptions } from "@/onboarding/household-query";
import { profileQueryOptions } from "@/onboarding/profile-query";
import { CookingPreferencesSection } from "./cooking-preferences-section";
import { HouseholdSection } from "./household-section";
import { LogoutSection } from "./logout-section";
import { PersonalInformationSection } from "./personal-information-section";
import { ProfileError } from "./profile-error";
import { ProfileLoading } from "./profile-loading";

export function ProfilePage() {
	const queryClient = useQueryClient();
	const auth = useAuth();
	const profile = useQuery(profileQueryOptions(queryClient));
	const household = useQuery(householdQueryOptions(queryClient));
	const isPending = profile.isPending || household.isPending;
	const cannotRender =
		!auth.user ||
		profile.isError ||
		household.isError ||
		profile.data === null ||
		household.data === null;

	function retry() {
		void Promise.all([profile.refetch(), household.refetch()]);
	}

	return (
		<PageContainer>
			<div className="space-y-7">
				<header className="space-y-2">
					<p className="text-sm font-extrabold text-primary">Your Flemme</p>
					<h1 className="font-heading text-4xl leading-none tracking-tight sm:text-5xl">
						Profile
					</h1>
					<p className="max-w-md leading-relaxed text-muted-foreground">
						Keep the personal cooking context Flemme remembers up to date.
					</p>
				</header>

				{isPending ? <ProfileLoading /> : null}
				{!isPending && cannotRender ? <ProfileError onRetry={retry} /> : null}
				{!isPending &&
				!cannotRender &&
				auth.user &&
				profile.data &&
				household.data ? (
					<div className="space-y-5">
						<PersonalInformationSection user={auth.user} />
						<CookingPreferencesSection profile={profile.data} />
						<HouseholdSection household={household.data} />
						<LogoutSection />
					</div>
				) : null}
			</div>
		</PageContainer>
	);
}
