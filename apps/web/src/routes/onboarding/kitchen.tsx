import {
	type KitchenEquipmentCategory,
	kitchenEquipmentCatalog,
} from "@flemme/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
				<p
					className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
					role="alert"
				>
					{kitchenErrorMessage(kitchenQuery.error)}
				</p>
				<Button
					type="button"
					variant="outline"
					className="rounded-xl"
					onClick={() => void kitchenQuery.refetch()}
					disabled={kitchenQuery.isRefetching}
				>
					Retry
				</Button>
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
		<div className="space-y-4">
			{equipmentGroups.map((group) => (
				<fieldset
					className="rounded-3xl bg-muted/45 p-5 shadow-control"
					key={group.category}
				>
					<legend className="float-left mb-4 w-full font-heading text-lg leading-tight tracking-tight">
						{group.label}
					</legend>
					<div className="clear-both grid grid-cols-2 gap-2">
						{kitchenEquipmentCatalog
							.filter((item) => item.category === group.category)
							.map((item) => {
								const selected = equipment.includes(item.key);
								return (
									<Button
										type="button"
										key={item.key}
										variant="ghost"
										className={cn(
											"h-auto min-h-14 justify-between rounded-2xl border border-transparent bg-card px-3 py-2 text-left whitespace-normal shadow-none hover:border-transparent",
											selected && "bg-secondary hover:bg-secondary/85",
										)}
										aria-pressed={selected}
										disabled={disabled}
										onClick={() =>
											setEquipment((current) =>
												toggleEquipment(current, item.key),
											)
										}
									>
										<span>{item.label}</span>
										<span
											className="grid size-6 shrink-0 place-items-center rounded-lg bg-background"
											aria-hidden="true"
										>
											{selected ? <Check className="size-4" /> : null}
										</span>
									</Button>
								);
							})}
					</div>
				</fieldset>
			))}
			<p
				className={cn(
					"text-center text-sm font-bold",
					invalid ? "text-destructive" : "text-muted-foreground",
				)}
				aria-live="polite"
			>
				{invalid
					? "Select at least one equipment item."
					: `${equipment.length} ${equipment.length === 1 ? "item" : "items"} selected`}
			</p>
			<Button
				type="button"
				className="w-full rounded-xl"
				disabled={disabled || invalid}
				onClick={() => onContinue({ equipment })}
			>
				{disabled ? "Saving…" : "Continue"}
			</Button>
			{errorMessage ? (
				<p
					className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
					role="alert"
				>
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
