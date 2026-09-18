import type { CreateInventoryItem } from "@flemme/contracts/inventory";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageContainer } from "@/components/app";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { InventoryEmpty } from "./inventory-empty";
import { InventoryError } from "./inventory-error";
import { InventoryForm } from "./inventory-form";
import { InventoryList } from "./inventory-list";
import { InventoryLoading } from "./inventory-loading";
import {
	inventoryMutationErrorMessage,
	useCreateInventoryItemMutation,
} from "./inventory-mutations";
import { useInventory } from "./inventory-query";

export function InventoryPage() {
	const inventory = useInventory();
	const create = useCreateInventoryItemMutation();
	const [addOpen, setAddOpen] = useState(false);
	const items = inventory.data?.items ?? [];

	async function addItem(input: CreateInventoryItem) {
		try {
			await create.mutateAsync(input);
			setAddOpen(false);
			return true;
		} catch {
			return false;
		}
	}

	function changeAddOpen(open: boolean) {
		setAddOpen(open);
		if (!open) create.reset();
	}

	return (
		<PageContainer className="space-y-5 pt-4 sm:space-y-6 sm:pt-6">
			<div className="flex items-start justify-between gap-4 rounded-3xl bg-secondary p-5 shadow-card">
				<header className="min-w-0 space-y-2">
					<h1 className="font-heading text-3xl leading-none tracking-tight sm:text-4xl">
						Inventory
					</h1>
					<p className="leading-relaxed text-muted-foreground">
						What do you have right now?
					</p>
				</header>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="border-transparent bg-card/75 shadow-none hover:border-transparent hover:bg-card"
					onClick={() => setAddOpen(true)}
				>
					<Plus aria-hidden="true" />
					<span className="hidden min-[360px]:inline">Add ingredient</span>
					<span className="min-[360px]:hidden">Add</span>
				</Button>
			</div>

			{inventory.isPending ? <InventoryLoading /> : null}
			{inventory.isError ? (
				<InventoryError onRetry={() => void inventory.refetch()} />
			) : null}
			{inventory.isSuccess && items.length === 0 ? (
				<InventoryEmpty onAdd={() => setAddOpen(true)} />
			) : null}
			{items.length > 0 ? <InventoryList items={items} /> : null}

			<Dialog open={addOpen} onOpenChange={changeAddOpen}>
				<DialogContent className="gap-0 overflow-hidden border-transparent p-0 shadow-card">
					<DialogHeader className="m-4 mb-0 rounded-2xl bg-secondary p-5 pr-14">
						<DialogTitle>Add ingredient</DialogTitle>
						<DialogDescription>
							Add what you have now. Quantity is optional.
						</DialogDescription>
					</DialogHeader>
					<div className="p-5">
						<InventoryForm
							key={String(addOpen)}
							isPending={create.isPending}
							errorMessage={
								create.isError
									? inventoryMutationErrorMessage(create.error)
									: undefined
							}
							onSubmit={addItem}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</PageContainer>
	);
}
