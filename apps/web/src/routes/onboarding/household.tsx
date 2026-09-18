import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import { HouseholdForm } from "../../onboarding/household-form";
import {
	defaultHousehold,
	type HouseholdState,
	householdErrorMessage,
	householdQueryOptions,
	householdStateKey,
	saveHouseholdAndResolveNext,
} from "../../onboarding/household-query";
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
		if (decision.completed) return;
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"household",
		);
		if (target) throw redirect({ to: target });
	},
	component: OnboardingHouseholdPage,
});

function OnboardingHouseholdPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [mutationError, setMutationError] = useState<string | null>(null);
	const submitLock = useRef(false);
	const householdQuery = useQuery(householdQueryOptions(queryClient));
	const household = householdQuery.data ?? defaultHousehold;
	const saveHousehold = useMutation({
		mutationFn: async (payload: HouseholdState) =>
			saveHouseholdAndResolveNext(
				queryClient,
				payload,
				"/onboarding/household",
			),
	});

	if (householdQuery.isPending && !householdQuery.isFetched) {
		return (
			<OnboardingStepShell
				title="Who's eating with you?"
				description="Tell Flemme who you usually cook for."
			>
				<p aria-live="polite">Loading your household…</p>
			</OnboardingStepShell>
		);
	}

	if (householdQuery.isError) {
		return (
			<OnboardingStepShell
				title="Who's eating with you?"
				description="We could not load your existing household."
			>
				<p className="form-error" role="alert">
					{householdErrorMessage(householdQuery.error)}
				</p>
				<button
					type="button"
					className="secondary-button"
					onClick={() => void householdQuery.refetch()}
					disabled={householdQuery.isRefetching}
				>
					Retry
				</button>
			</OnboardingStepShell>
		);
	}

	const persistHousehold = async (nextHousehold: HouseholdState) => {
		if (submitLock.current) return;
		submitLock.current = true;
		setMutationError(null);
		try {
			const target = await saveHousehold.mutateAsync(nextHousehold);
			await navigate({ to: target });
		} catch (error) {
			setMutationError(householdErrorMessage(error));
		} finally {
			submitLock.current = false;
		}
	};

	return (
		<OnboardingStepShell
			title="Who's eating with you?"
			description="We'll use this to make recipes and portions more relevant."
		>
			<HouseholdForm
				key={householdStateKey(household)}
				initialHousehold={household}
				disabled={saveHousehold.isPending}
				submitLabel="Continue"
				errorMessage={mutationError}
				onSubmit={(nextHousehold) => void persistHousehold(nextHousehold)}
			/>
		</OnboardingStepShell>
	);
}
