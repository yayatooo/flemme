import {
	type CreateInventoryItem,
	CreateInventoryItemSchema,
	type InventoryItemResponse,
} from "@flemme/contracts/inventory";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface InventoryFormProps {
	item?: InventoryItemResponse;
	isPending: boolean;
	errorMessage?: string;
	onSubmit: (input: CreateInventoryItem) => Promise<boolean>;
}

export function InventoryForm({
	item,
	isPending,
	errorMessage,
	onSubmit,
}: InventoryFormProps) {
	const [name, setName] = useState(item?.name ?? "");
	const [quantity, setQuantity] = useState(
		item?.quantity === null || item?.quantity === undefined
			? ""
			: String(item.quantity),
	);
	const [unit, setUnit] = useState(item?.unit ?? "");
	const [validationMessage, setValidationMessage] = useState<string>();

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isPending) return;
		const trimmedQuantity = quantity.trim();
		const parsed = CreateInventoryItemSchema.safeParse({
			name,
			quantity: trimmedQuantity ? Number(trimmedQuantity) : null,
			unit: unit.trim() || null,
			isApproximate: item?.isApproximate ?? false,
			condition: item?.condition ?? "unknown",
		});
		if (!parsed.success) {
			setValidationMessage(
				"Enter a name and, when using a quantity, a positive number with a unit.",
			);
			return;
		}
		setValidationMessage(undefined);
		await onSubmit(parsed.data);
	}

	const message = validationMessage ?? errorMessage;

	return (
		<form className="space-y-5" onSubmit={submit}>
			<label className="grid gap-2 font-extrabold" htmlFor="inventory-name">
				Ingredient name
				<Input
					id="inventory-name"
					className="text-base!"
					name="ingredient-name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					maxLength={120}
					autoComplete="off"
					autoFocus
					required
					disabled={isPending}
				/>
			</label>
			<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
				<label
					className="grid gap-2 font-extrabold"
					htmlFor="inventory-quantity"
				>
					Quantity <span className="text-xs font-medium">(optional)</span>
					<Input
						id="inventory-quantity"
						className="text-base!"
						name="quantity"
						type="number"
						inputMode="decimal"
						min="0.001"
						step="0.001"
						value={quantity}
						onChange={(event) => setQuantity(event.target.value)}
						disabled={isPending}
					/>
				</label>
				<label className="grid gap-2 font-extrabold" htmlFor="inventory-unit">
					Unit <span className="text-xs font-medium">(optional)</span>
					<Input
						id="inventory-unit"
						className="text-base!"
						name="unit"
						value={unit}
						onChange={(event) => setUnit(event.target.value)}
						maxLength={40}
						autoComplete="off"
						disabled={isPending}
						placeholder="pcs, g, bunch"
					/>
				</label>
			</div>
			<p className="text-xs leading-relaxed text-muted-foreground">
				Quantity is optional. Flemme will recognize known ingredient names
				without guessing unknown ones.
			</p>
			{message ? (
				<p
					className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 font-bold text-destructive"
					role="alert"
				>
					{message}
				</p>
			) : null}
			<DialogFooter>
				<DialogClose
					render={<Button type="button" variant="outline" />}
					disabled={isPending}
				>
					Cancel
				</DialogClose>
				<Button type="submit" disabled={isPending || !name.trim()}>
					{isPending ? "Saving…" : item ? "Save changes" : "Add ingredient"}
				</Button>
			</DialogFooter>
		</form>
	);
}
