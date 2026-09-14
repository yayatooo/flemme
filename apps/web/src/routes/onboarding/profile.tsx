import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";
import {
	buildProfilePayload,
	cookingPreferenceOptions,
	emptyProfile,
	foodPreferenceOptions,
	type ProfileState,
	preferenceOptionsWithPersistedValues,
	profileErrorMessage,
	profileQueryOptions,
	profileStateKey,
	saveProfileAndResolveNext,
	togglePreferenceValue,
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
				<p className="form-error" role="alert">
					{profileErrorMessage(profileQuery.error)}
				</p>
				<button
					type="button"
					className="secondary-button"
					onClick={() => void profileQuery.refetch()}
					disabled={profileQuery.isRefetching}
				>
					Retry
				</button>
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
				onContinue={(next) => void persistProfile(next)}
				onSkip={() => void persistProfile(buildProfilePayload([], []))}
				errorMessage={mutationError}
			/>
		</OnboardingStepShell>
	);
}

interface ProfilePreferenceFormProps {
	initialFoodPreferences: string[];
	initialCookingPreferences: string[];
	disabled: boolean;
	errorMessage: string | null;
	onContinue: (state: ProfileState) => void;
	onSkip: () => void;
}

function ProfilePreferenceForm({
	initialFoodPreferences,
	initialCookingPreferences,
	disabled,
	errorMessage,
	onContinue,
	onSkip,
}: ProfilePreferenceFormProps) {
	const [foodPreferences, setFoodPreferences] = useState(
		initialFoodPreferences,
	);
	const [cookingPreferences, setCookingPreferences] = useState(
		initialCookingPreferences,
	);
	const visibleFoodOptions = preferenceOptionsWithPersistedValues(
		foodPreferenceOptions,
		foodPreferences,
	);
	const visibleCookingOptions = preferenceOptionsWithPersistedValues(
		cookingPreferenceOptions,
		cookingPreferences,
	);

	return (
		<div>
			<PreferenceGroup
				title="Food preferences"
				options={visibleFoodOptions}
				selectedValues={foodPreferences}
				disabled={disabled}
				onToggle={(value) =>
					setFoodPreferences((current) => togglePreferenceValue(current, value))
				}
			/>
			<PreferenceGroup
				title="Cooking preferences"
				options={visibleCookingOptions}
				selectedValues={cookingPreferences}
				disabled={disabled}
				onToggle={(value) =>
					setCookingPreferences((current) =>
						togglePreferenceValue(current, value),
					)
				}
			/>
			<div className="preference-actions">
				<button
					type="button"
					className="primary-button"
					disabled={disabled}
					onClick={() =>
						onContinue(buildProfilePayload(foodPreferences, cookingPreferences))
					}
				>
					{disabled ? "Saving…" : "Continue"}
				</button>
				<button
					type="button"
					className="secondary-button"
					disabled={disabled}
					onClick={onSkip}
				>
					Skip
				</button>
			</div>
			{errorMessage ? (
				<p className="form-error" role="alert">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}

function PreferenceGroup({
	title,
	options,
	selectedValues,
	disabled,
	onToggle,
}: {
	title: string;
	options: ReadonlyArray<{ value: string; label: string }>;
	selectedValues: ReadonlyArray<string>;
	disabled: boolean;
	onToggle: (value: string) => void;
}) {
	return (
		<fieldset className="preference-section">
			<legend>{title}</legend>
			<div className="preference-grid">
				{options.map((option) => {
					const selected = selectedValues.includes(option.value);
					return (
						<button
							key={option.value}
							type="button"
							className={`preference-chip ${selected ? "is-selected" : ""}`}
							aria-pressed={selected}
							disabled={disabled}
							onClick={() => onToggle(option.value)}
						>
							<span aria-hidden="true">{selected ? "✓" : "◯"}</span>
							{option.label}
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}
