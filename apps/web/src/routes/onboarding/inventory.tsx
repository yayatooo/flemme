import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import { requireAuthenticatedUser } from "../../auth/auth-guards";
import {
	addInventoryLater,
	addPendingInventoryItem,
	emptyInventory,
	ingredientSuggestions,
	inventoryErrorMessage,
	inventoryQueryOptions,
	inventoryStateKey,
	type PendingInventoryItem,
	saveInitialInventory,
} from "../../onboarding/inventory-query";
import {
	onboardingQueryOptions,
	resolveOnboardingRedirect,
} from "../../onboarding/onboarding-query";
import { OnboardingStepShell } from "../../onboarding/onboarding-step-shell";

export const Route = createFileRoute("/onboarding/inventory")({
	beforeLoad: async ({ context, location }) => {
		await requireAuthenticatedUser(context.queryClient);
		const decision = await context.queryClient.ensureQueryData(
			onboardingQueryOptions(context.queryClient),
		);
		const target = resolveOnboardingRedirect(
			decision,
			location.pathname,
			"inventory",
		);
		if (target) throw redirect({ to: target });
	},
	component: OnboardingInventoryPage,
});

function OnboardingInventoryPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [mutationError, setMutationError] = useState<string | null>(null);
	const submitLock = useRef(false);
	const inventoryQuery = useQuery(inventoryQueryOptions(queryClient));
	const inventory = inventoryQuery.data ?? emptyInventory;
	const completeInventory = useMutation({
		mutationFn: async ({
			action,
			items,
		}: {
			action: "save" | "later";
			items: ReadonlyArray<PendingInventoryItem>;
		}) =>
			action === "save"
				? saveInitialInventory(queryClient, items)
				: addInventoryLater(queryClient),
	});

	if (inventoryQuery.isPending && !inventoryQuery.isFetched) {
		return (
			<OnboardingStepShell
				title="What's in your kitchen?"
				description="Add a few ingredients you already have."
			>
				<p aria-live="polite">Loading your inventory…</p>
			</OnboardingStepShell>
		);
	}

	if (inventoryQuery.isError) {
		return (
			<OnboardingStepShell
				title="What's in your kitchen?"
				description="We could not load your existing inventory."
			>
				<p className="form-error" role="alert">
					{inventoryErrorMessage(inventoryQuery.error)}
				</p>
				<button
					type="button"
					className="secondary-button"
					onClick={() => void inventoryQuery.refetch()}
					disabled={inventoryQuery.isRefetching}
				>
					Retry
				</button>
			</OnboardingStepShell>
		);
	}

	const persistInventory = async (
		action: "save" | "later",
		items: ReadonlyArray<PendingInventoryItem>,
	) => {
		if (submitLock.current) return;
		submitLock.current = true;
		setMutationError(null);
		try {
			const target = await completeInventory.mutateAsync({ action, items });
			await navigate({ to: target });
		} catch (error) {
			setMutationError(inventoryErrorMessage(error));
		} finally {
			submitLock.current = false;
		}
	};

	return (
		<OnboardingStepShell
			title="What's in your kitchen?"
			description="Add a few ingredients you already have for better recommendations."
		>
			<InitialInventoryForm
				key={inventoryStateKey(inventory)}
				initialItems={inventory.items.map((item) => ({
					identity: item.ingredientKey ?? item.name.toLowerCase(),
					name: item.name,
				}))}
				disabled={completeInventory.isPending}
				errorMessage={mutationError}
				onFinish={(items) => void persistInventory("save", items)}
				onAddLater={(items) => void persistInventory("later", items)}
			/>
		</OnboardingStepShell>
	);
}

interface InitialInventoryFormProps {
	initialItems: PendingInventoryItem[];
	disabled: boolean;
	errorMessage: string | null;
	onFinish: (items: ReadonlyArray<PendingInventoryItem>) => void;
	onAddLater: (items: ReadonlyArray<PendingInventoryItem>) => void;
}

function InitialInventoryForm({
	initialItems,
	disabled,
	errorMessage,
	onFinish,
	onAddLater,
}: InitialInventoryFormProps) {
	const [items, setItems] = useState(initialItems);
	const [input, setInput] = useState("");
	const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

	const addItem = (name: string) => {
		const result = addPendingInventoryItem(items, name);
		if (result.duplicate) {
			setDuplicateMessage(`${name.trim()} is already in your inventory.`);
			return;
		}
		if (result.items.length === items.length) return;
		setItems(result.items);
		setInput("");
		setDuplicateMessage(null);
	};

	const submitInput = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		addItem(input);
	};

	return (
		<div className="initial-inventory-form">
			<form className="ingredient-entry" onSubmit={submitInput}>
				<label htmlFor="ingredient-name">Search or add ingredient</label>
				<div>
					<input
						id="ingredient-name"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="Try “telur” or “daun gedi”"
						disabled={disabled}
						autoComplete="off"
					/>
					<button
						type="submit"
						aria-label="Add ingredient"
						disabled={disabled || input.trim().length === 0}
					>
						<Plus className="ingredient-add-icon" aria-hidden="true" />
					</button>
				</div>
			</form>
			{duplicateMessage ? (
				<p className="field-feedback" role="status">
					{duplicateMessage}
				</p>
			) : null}
			<section className="ingredient-suggestions">
				<h2>Suggestions</h2>
				<div>
					{ingredientSuggestions.map((suggestion) => (
						<button
							type="button"
							key={suggestion}
							disabled={disabled}
							onClick={() => addItem(suggestion)}
						>
							{suggestion}
						</button>
					))}
				</div>
			</section>
			<section
				className="selected-ingredients"
				aria-labelledby="selected-title"
			>
				<h2 id="selected-title">Your ingredients</h2>
				{items.length === 0 ? (
					<p>No ingredients added yet. That's okay—you can add them later.</p>
				) : (
					<div>
						{items.map((item) => (
							<span className="ingredient-chip" key={item.identity}>
								{item.name}
								<button
									type="button"
									aria-label={`Remove ${item.name}`}
									disabled={disabled}
									onClick={() =>
										setItems((current) =>
											current.filter(
												(existing) => existing.identity !== item.identity,
											),
										)
									}
								>
									<X className="ingredient-remove-icon" aria-hidden="true" />
								</button>
							</span>
						))}
					</div>
				)}
			</section>
			<p className="inventory-summary" aria-live="polite">
				{items.length} {items.length === 1 ? "ingredient" : "ingredients"} added
			</p>
			<div className="inventory-actions">
				{items.length > 0 ? (
					<button
						type="button"
						className="primary-button"
						disabled={disabled}
						onClick={() => onFinish(items)}
					>
						{disabled ? "Saving…" : "Finish Setup"}
					</button>
				) : null}
				<button
					type="button"
					className={items.length === 0 ? "primary-button" : "secondary-button"}
					disabled={disabled}
					onClick={() => onAddLater(items)}
				>
					{disabled ? "Finishing…" : "Add later"}
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
