import { COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH } from "@flemme/contracts/cooking-session";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface RenameDishDialogProps {
	open: boolean;
	originalName: string;
	customName: string | null | undefined;
	isPending: boolean;
	errorMessage?: string;
	onOpenChange: (open: boolean) => void;
	onSave: (customName: string | null) => Promise<boolean>;
}

export function RenameDishDialog({
	open,
	originalName,
	customName,
	isPending,
	errorMessage,
	onOpenChange,
	onSave,
}: RenameDishDialogProps) {
	const [name, setName] = useState(customName ?? originalName);
	const trimmedName = name.trim();
	const nextCustomName =
		!trimmedName || trimmedName === originalName.trim() ? null : trimmedName;
	const persistedCustomName = customName?.trim() || null;
	const hasChanged = nextCustomName !== persistedCustomName;

	async function saveName(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!hasChanged || isPending) return;
		if (await onSave(nextCustomName)) onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form className="space-y-5" onSubmit={saveName}>
					<DialogHeader>
						<DialogTitle>Rename this dish</DialogTitle>
						<DialogDescription>
							Choose the name shown for this cooking session. The original
							recipe and cooking plan stay unchanged.
						</DialogDescription>
					</DialogHeader>
					<label className="grid gap-2 font-extrabold" htmlFor="dish-name">
						Dish name
						<Input
							id="dish-name"
							name="dish-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							maxLength={COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH}
							autoComplete="off"
							autoFocus
							disabled={isPending}
						/>
						<span className="text-xs font-medium text-muted-foreground">
							Up to {COOKING_SESSION_CUSTOM_NAME_MAX_LENGTH} characters. Leave
							blank to use the original recipe name.
						</span>
					</label>
					{errorMessage ? (
						<p
							className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold text-destructive"
							role="alert"
						>
							{errorMessage}
						</p>
					) : null}
					<DialogFooter>
						<DialogClose
							render={<Button type="button" variant="outline" />}
							disabled={isPending}
						>
							Cancel
						</DialogClose>
						<Button type="submit" disabled={!hasChanged || isPending}>
							{isPending ? "Saving..." : "Save name"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
