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
		<PageContainer>
			<div className="flex items-start justify-between gap-4">
				<header className="min-w-0 space-y-2">
					<h1 className="font-heading text-4xl leading-none tracking-tight">
						Inventory
					</h1>
					<p className="leading-relaxed text-muted-foreground">
						What do you have right now?
					</p>
				</header>
				<Button type="button" size="sm" onClick={() => setAddOpen(true)}>
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add ingredient</DialogTitle>
						<DialogDescription>
							Add what you have now. Quantity is optional.
						</DialogDescription>
					</DialogHeader>
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
				</DialogContent>
			</Dialog>
		</PageContainer>
	);
}
