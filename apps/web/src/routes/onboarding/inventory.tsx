import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
				<p
					className="rounded-2xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
					role="alert"
				>
					{inventoryErrorMessage(inventoryQuery.error)}
				</p>
				<Button
					type="button"
					variant="outline"
					className="rounded-xl"
					onClick={() => void inventoryQuery.refetch()}
					disabled={inventoryQuery.isRefetching}
				>
					Retry
				</Button>
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
		<div className="space-y-5">
			<form className="space-y-2" onSubmit={submitInput}>
				<label className="text-sm font-extrabold" htmlFor="ingredient-name">
					Search or add ingredient
				</label>
				<div className="grid grid-cols-[minmax(0,1fr)_3.5rem] gap-2">
					<Input
						id="ingredient-name"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="Try “telur” or “daun gedi”"
						disabled={disabled}
						autoComplete="off"
					/>
					<Button
						type="submit"
						variant="secondary"
						size="icon-lg"
						className="rounded-xl shadow-none"
						aria-label="Add ingredient"
						disabled={disabled || input.trim().length === 0}
					>
						<Plus aria-hidden="true" />
					</Button>
				</div>
			</form>
			{duplicateMessage ? (
				<p className="-mt-3 text-sm text-muted-foreground" role="status">
					{duplicateMessage}
				</p>
			) : null}
			<section className="space-y-3 rounded-3xl bg-lavender/30 p-4 shadow-control">
				<h2 className="font-heading text-lg">Suggestions</h2>
				<div className="flex flex-wrap gap-2">
					{ingredientSuggestions.map((suggestion) => (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-auto min-h-10 rounded-xl border-transparent bg-card px-3 py-2 shadow-none hover:border-transparent"
							key={suggestion}
							disabled={disabled}
							onClick={() => addItem(suggestion)}
						>
							{suggestion}
						</Button>
					))}
				</div>
			</section>
			<section
				className="space-y-3 rounded-3xl bg-secondary/25 p-4 shadow-control"
				aria-labelledby="selected-title"
			>
				<h2 id="selected-title" className="font-heading text-lg">
					Your ingredients
				</h2>
				{items.length === 0 ? (
					<p className="text-sm leading-relaxed text-muted-foreground">
						No ingredients added yet. That's okay—you can add them later.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{items.map((item) => (
							<span
								className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-secondary py-1 pr-1 pl-3 text-sm font-extrabold"
								key={item.identity}
							>
								{item.name}
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="size-8 rounded-lg border-transparent bg-card/75 shadow-none hover:border-transparent hover:bg-card"
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
									<X className="size-4" aria-hidden="true" />
								</Button>
							</span>
						))}
					</div>
				)}
			</section>
			<p
				className="text-center text-sm font-bold text-muted-foreground"
				aria-live="polite"
			>
				{items.length} {items.length === 1 ? "ingredient" : "ingredients"} added
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				{items.length > 0 ? (
					<Button
						type="button"
						className="w-full rounded-xl"
						disabled={disabled}
						onClick={() => onFinish(items)}
					>
						{disabled ? "Saving…" : "Finish Setup"}
					</Button>
				) : null}
				<Button
					type="button"
					variant={items.length === 0 ? "default" : "outline"}
					className="w-full rounded-xl"
					disabled={disabled}
					onClick={() => onAddLater(items)}
				>
					{disabled ? "Finishing…" : "Add later"}
				</Button>
			</div>
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
