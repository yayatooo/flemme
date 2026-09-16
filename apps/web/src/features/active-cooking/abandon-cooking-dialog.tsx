import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface AbandonCookingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	disabled: boolean;
	isPending: boolean;
	onConfirm: () => Promise<boolean>;
}

export function AbandonCookingDialog({
	open,
	onOpenChange,
	disabled,
	isPending,
	onConfirm,
}: AbandonCookingDialogProps) {
	async function confirmAbandon() {
		if (await onConfirm()) onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						className="text-destructive hover:bg-destructive/10"
						disabled={disabled}
					/>
				}
			>
				Abandon cooking
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Abandon this cooking session?</DialogTitle>
					<DialogDescription>
						This stops the session permanently. Your saved plan and progress
						remain in the record, but cooking cannot be resumed.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						variant="destructive"
						disabled={isPending}
						onClick={() => void confirmAbandon()}
					>
						{isPending ? "Stopping session..." : "Yes, abandon cooking"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
