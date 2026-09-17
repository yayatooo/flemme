import type { InventoryItemResponse } from "@flemme/contracts/inventory";
import {
	CircleAlert,
	LoaderCircle,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryForm } from "./inventory-form";
import {
	inventoryMutationErrorMessage,
	useDeleteInventoryItemMutation,
	useUpdateInventoryItemMutation,
} from "./inventory-mutations";

function quantityLabel(item: InventoryItemResponse) {
	if (item.quantity === null || item.unit === null) return null;
	return `${item.isApproximate ? "About " : ""}${item.quantity} ${item.unit}`;
}

interface InventoryItemProps {
	item: InventoryItemResponse;
}

export function InventoryItem({ item }: InventoryItemProps) {
	const [editOpen, setEditOpen] = useState(false);
	const update = useUpdateInventoryItemMutation(item.id);
	const remove = useDeleteInventoryItemMutation(item.id);
	const quantity = quantityLabel(item);

	async function save(input: Parameters<typeof update.mutateAsync>[0]) {
		try {
			await update.mutateAsync(input);
			setEditOpen(false);
			return true;
		} catch {
			return false;
		}
	}

	function changeEditOpen(open: boolean) {
		setEditOpen(open);
		if (!open) update.reset();
	}

	return (
		<>
			<Card className="shadow-none">
				<CardContent className="flex items-start gap-3">
					<div className="min-w-0 flex-1 space-y-1">
						<h2 className="break-words font-heading text-xl leading-tight">
							{item.name}
						</h2>
						{quantity ? (
							<p className="font-semibold text-muted-foreground">{quantity}</p>
						) : (
							<p className="text-sm text-muted-foreground">Quantity not set</p>
						)}
						{item.ingredientKey === null ? (
							<Badge variant="secondary">Not recognized yet</Badge>
						) : null}
					</div>
					{remove.isPending ? (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled
							aria-label={`Removing ${item.name}`}
						>
							<LoaderCircle className="animate-spin" aria-hidden="true" />
						</Button>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={`Options for ${item.name}`}
									/>
								}
							>
								<MoreHorizontal aria-hidden="true" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => setEditOpen(true)}>
									<Pencil aria-hidden="true" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-destructive"
									onClick={() => remove.mutate()}
								>
									<Trash2 aria-hidden="true" />
									Remove
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</CardContent>
				{remove.isError ? (
					<CardContent>
						<div
							className="space-y-2 rounded-2xl border-2 border-destructive/60 bg-destructive/10 p-3 text-sm"
							role="alert"
						>
							<div className="flex items-start gap-2">
								<CircleAlert
									className="mt-0.5 size-4 shrink-0"
									aria-hidden="true"
								/>
								<p>{inventoryMutationErrorMessage(remove.error)}</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => remove.mutate()}
							>
								Try removing again
							</Button>
						</div>
					</CardContent>
				) : null}
			</Card>

			<Dialog open={editOpen} onOpenChange={changeEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit ingredient</DialogTitle>
						<DialogDescription>
							Changing the name checks canonical ingredient identity again.
						</DialogDescription>
					</DialogHeader>
					<InventoryForm
						key={`${item.id}:${item.name}:${item.quantity}:${item.unit}`}
						item={item}
						isPending={update.isPending}
						errorMessage={
							update.isError
								? inventoryMutationErrorMessage(update.error)
								: undefined
						}
						onSubmit={save}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
