import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";
import { ProfilePreferenceForm } from "../../onboarding/profile-preference-form";
import {
	buildProfilePayload,
	emptyProfile,
	type ProfileState,
	profileErrorMessage,
	profileQueryOptions,
	profileStateKey,
	saveProfileAndResolveNext,
} from "../../onboarding/profile-query";

export const Route = createFileRoute("/onboarding/profile")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const decision = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"profile",
		);
		if (target) throw redirect({ to: target });
	},
	component: OnboardingProfilePage,
});

function OnboardingProfilePage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [mutationError, setMutationError] = useState<string | null>(null);
	const submitLock = useRef(false);
	const profileQuery = useQuery(profileQueryOptions(queryClient));
	const profile = profileQuery.data ?? emptyProfile;
	const saveProfile = useMutation({
		mutationFn: async (payload: ProfileState) =>
			saveProfileAndResolveNext(queryClient, payload, "/onboarding/profile"),
	});

	if (profileQuery.isPending && !profileQuery.isFetched) {
		return (
			<OnboardingStepShell
				title="Set your cooking preferences"
				description="Choose your current food and cooking preferences."
			>
				<p aria-live="polite">Loading your profile preferences…</p>
			</OnboardingStepShell>
		);
	}

	if (profileQuery.isError) {
		return (
			<OnboardingStepShell
				title="Set your cooking preferences"
				description="We could not load your existing profile preferences."
			>
				<p
					className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
					role="alert"
				>
					{profileErrorMessage(profileQuery.error)}
				</p>
				<Button
					type="button"
					variant="outline"
					className="rounded-xl"
					onClick={() => void profileQuery.refetch()}
					disabled={profileQuery.isRefetching}
				>
					Retry
				</Button>
			</OnboardingStepShell>
		);
	}

	const persistProfile = async (nextProfile: ProfileState) => {
		if (submitLock.current) return;
		submitLock.current = true;
		setMutationError(null);
		try {
			const target = await saveProfile.mutateAsync(nextProfile);
			await navigate({ to: target });
		} catch (error) {
			setMutationError(profileErrorMessage(error));
		} finally {
			submitLock.current = false;
		}
	};

	return (
		<OnboardingStepShell
			title="Set your cooking preferences"
			description="Tell Flemme how to tailor recommendations."
		>
			<ProfilePreferenceForm
				key={profileStateKey(profile)}
				initialFoodPreferences={profile.foodPreferences}
				initialCookingPreferences={profile.cookingPreferences}
				disabled={saveProfile.isPending}
				submitLabel="Continue"
				onSubmit={(next) => void persistProfile(next)}
				onSkip={() => void persistProfile(buildProfilePayload([], []))}
				errorMessage={mutationError}
			/>
		</OnboardingStepShell>
	);
}
