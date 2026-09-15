import {
	type KitchenEquipmentCategory,
	kitchenEquipmentCatalog,
} from "@flemme/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useRef, useState } from "react";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	emptyKitchen,
	type KitchenState,
	kitchenErrorMessage,
	kitchenQueryOptions,
	kitchenStateKey,
	saveKitchenAndResolveNext,
	toggleEquipment,
} from "../../onboarding/kitchen-query";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";

const equipmentGroups: ReadonlyArray<{
	category: KitchenEquipmentCategory;
	label: string;
}> = [
	{ category: "cooking-heat", label: "Heat & Cooking" },
	{ category: "cookware", label: "Cookware" },
	{ category: "preparation", label: "Preparation" },
	{ category: "cooking-method", label: "Cooking Methods" },
	{ category: "utility", label: "Useful Tools" },
];

export const Route = createFileRoute("/onboarding/kitchen")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const decision = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		if (decision.completed) return;
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"kitchen",
		);
		if (target) throw redirect({ to: target });
	},
	component: OnboardingKitchenPage,
});

function OnboardingKitchenPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [mutationError, setMutationError] = useState<string | null>(null);
	const submitLock = useRef(false);
	const kitchenQuery = useQuery(kitchenQueryOptions(queryClient));
	const kitchen = kitchenQuery.data ?? emptyKitchen;
	const saveKitchen = useMutation({
		mutationFn: async (payload: KitchenState) =>
			saveKitchenAndResolveNext(queryClient, payload, "/onboarding/kitchen"),
	});

	if (kitchenQuery.isPending && !kitchenQuery.isFetched) {
		return (
			<OnboardingStepShell
				title="What do you cook with?"
				description="Select the kitchen equipment you normally have available."
			>
				<p aria-live="polite">Loading your kitchen equipment…</p>
			</OnboardingStepShell>
		);
	}

	if (kitchenQuery.isError) {
		return (
			<OnboardingStepShell
				title="What do you cook with?"
				description="We could not load your existing kitchen equipment."
			>
				<p className="form-error" role="alert">
					{kitchenErrorMessage(kitchenQuery.error)}
				</p>
				<button
					type="button"
					className="secondary-button"
					onClick={() => void kitchenQuery.refetch()}
					disabled={kitchenQuery.isRefetching}
				>
					Retry
				</button>
			</OnboardingStepShell>
		);
	}

	const persistKitchen = async (nextKitchen: KitchenState) => {
		if (submitLock.current) return;
		submitLock.current = true;
		setMutationError(null);
		try {
			const target = await saveKitchen.mutateAsync(nextKitchen);
			await navigate({ to: target });
		} catch (error) {
			setMutationError(kitchenErrorMessage(error));
		} finally {
			submitLock.current = false;
		}
	};

	return (
		<OnboardingStepShell
			title="What do you cook with?"
			description="Flemme will use this to recommend recipes you can actually make."
		>
			<KitchenEquipmentForm
				key={kitchenStateKey(kitchen)}
				initialKitchen={kitchen}
				disabled={saveKitchen.isPending}
				errorMessage={mutationError}
				onContinue={(nextKitchen) => void persistKitchen(nextKitchen)}
			/>
		</OnboardingStepShell>
	);
}

interface KitchenEquipmentFormProps {
	initialKitchen: KitchenState;
	disabled: boolean;
	errorMessage: string | null;
	onContinue: (kitchen: KitchenState) => void;
}

function KitchenEquipmentForm({
	initialKitchen,
	disabled,
	errorMessage,
	onContinue,
}: KitchenEquipmentFormProps) {
	const [equipment, setEquipment] = useState(initialKitchen.equipment);
	const invalid = equipment.length === 0;

	return (
		<div className="kitchen-form">
			{equipmentGroups.map((group) => (
				<fieldset className="equipment-group" key={group.category}>
					<legend>{group.label}</legend>
					<div className="equipment-grid">
						{kitchenEquipmentCatalog
							.filter((item) => item.category === group.category)
							.map((item) => {
								const selected = equipment.includes(item.key);
								return (
									<button
										type="button"
										key={item.key}
										className={`equipment-card ${selected ? "is-selected" : ""}`}
										aria-pressed={selected}
										disabled={disabled}
										onClick={() =>
											setEquipment((current) =>
												toggleEquipment(current, item.key),
											)
										}
									>
										<span>{item.label}</span>
										<span className="equipment-state" aria-hidden="true">
											{selected ? <Check className="equipment-check" /> : null}
										</span>
									</button>
								);
							})}
					</div>
				</fieldset>
			))}
			<p className="equipment-summary" aria-live="polite">
				{invalid
					? "Select at least one equipment item."
					: `${equipment.length} ${equipment.length === 1 ? "item" : "items"} selected`}
			</p>
			<button
				type="button"
				className="primary-button kitchen-continue"
				disabled={disabled || invalid}
				onClick={() => onContinue({ equipment })}
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
