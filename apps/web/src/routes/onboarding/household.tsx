import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	defaultHousehold,
	type HouseholdCategory,
	type HouseholdState,
	householdErrorMessage,
	householdMemberCount,
	householdQueryOptions,
	householdStateKey,
	MAX_HOUSEHOLD_COUNT,
	saveHouseholdAndResolveNext,
	updateHouseholdCount,
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
				errorMessage={mutationError}
				onContinue={(nextHousehold) => void persistHousehold(nextHousehold)}
			/>
		</OnboardingStepShell>
	);
}

interface HouseholdFormProps {
	initialHousehold: HouseholdState;
	disabled: boolean;
	errorMessage: string | null;
	onContinue: (household: HouseholdState) => void;
}

function HouseholdForm({
	initialHousehold,
	disabled,
	errorMessage,
	onContinue,
}: HouseholdFormProps) {
	const [household, setHousehold] = useState(initialHousehold);
	const total = householdMemberCount(household);
	const invalid = total === 0;

	return (
		<div className="household-form">
			<div className="household-steppers">
				<HouseholdStepper
					category="adults"
					label="Adults"
					description="Usually eats a regular portion"
					count={household.adults}
					disabled={disabled}
					onChange={(delta) =>
						setHousehold((current) =>
							updateHouseholdCount(current, "adults", delta),
						)
					}
				/>
				<HouseholdStepper
					category="children"
					label="Children"
					description="Smaller, family-friendly meals"
					count={household.children}
					disabled={disabled}
					onChange={(delta) =>
						setHousehold((current) =>
							updateHouseholdCount(current, "children", delta),
						)
					}
				/>
				<HouseholdStepper
					category="toddlers"
					label="Toddlers"
					description="Younger household members"
					count={household.toddlers}
					disabled={disabled}
					onChange={(delta) =>
						setHousehold((current) =>
							updateHouseholdCount(current, "toddlers", delta),
						)
					}
				/>
			</div>
			<p className="household-summary" aria-live="polite">
				{invalid
					? "Add at least one household member."
					: `${total} ${total === 1 ? "person" : "people"} in your household`}
			</p>
			<button
				type="button"
				className="primary-button household-continue"
				disabled={disabled || invalid}
				onClick={() => onContinue(household)}
			>
				{disabled ? "Saving…" : "Continue"}
			</button>
			{errorMessage ? (
				<p className="form-error" role="alert">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}

interface HouseholdStepperProps {
	category: HouseholdCategory;
	label: string;
	description: string;
	count: number;
	disabled: boolean;
	onChange: (delta: -1 | 1) => void;
}

function HouseholdStepper({
	category,
	label,
	description,
	count,
	disabled,
	onChange,
}: HouseholdStepperProps) {
	return (
		<section
			className="household-stepper"
			aria-labelledby={`${category}-label`}
		>
			<div>
				<h2 id={`${category}-label`}>{label}</h2>
				<p>{description}</p>
			</div>
			<div className="stepper-controls">
				<button
					type="button"
					aria-label={`Decrease ${category}`}
					disabled={disabled || count === 0}
					onClick={() => onChange(-1)}
				>
					<Minus className="stepper-icon" aria-hidden="true" />
				</button>
				<output aria-label={`${label} count`}>{count}</output>
				<button
					type="button"
					aria-label={`Increase ${category}`}
					disabled={disabled || count === MAX_HOUSEHOLD_COUNT}
					onClick={() => onChange(1)}
				>
					<Plus className="stepper-icon" aria-hidden="true" />
				</button>
			</div>
		</section>
	);
}
