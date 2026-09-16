import type { ActiveCookingPauseReason } from "@flemme/agent/active-cooking-input";
import { useState } from "react";
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

const pauseOptions: Array<{
	value: ActiveCookingPauseReason;
	label: string;
}> = [
	{ value: "user-request", label: "Pause for now" },
	{ value: "missing-ingredient", label: "Buying a missing ingredient" },
	{ value: "missing-equipment", label: "Finding different equipment" },
	{ value: "interruption", label: "Need to step away" },
	{ value: "other", label: "Other" },
];

interface PauseCookingDialogProps {
	disabled: boolean;
	isPending: boolean;
	onPause: (reason: ActiveCookingPauseReason) => Promise<boolean>;
}

export function PauseCookingDialog({
	disabled,
	isPending,
	onPause,
}: PauseCookingDialogProps) {
	const [open, setOpen] = useState(false);
	const [reason, setReason] =
		useState<ActiveCookingPauseReason>("user-request");

	async function submitPause(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (await onPause(reason)) setOpen(false);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button type="button" variant="outline" disabled={disabled} />}
			>
				Pause cooking
			</DialogTrigger>
			<DialogContent>
				<form className="space-y-5" onSubmit={submitPause}>
					<DialogHeader>
						<DialogTitle>Pause cooking?</DialogTitle>
						<DialogDescription>
							Your current step stays saved until you resume.
						</DialogDescription>
					</DialogHeader>
					<label className="grid gap-2 font-extrabold" htmlFor="pause-reason">
						Reason <span className="sr-only">for pausing</span>
						<select
							id="pause-reason"
							value={reason}
							onChange={(event) =>
								setReason(event.target.value as ActiveCookingPauseReason)
							}
							className="min-h-12 rounded-xl border-2 border-foreground bg-card px-4 text-base font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/70"
						>
							{pauseOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<DialogFooter>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving pause..." : "Pause cooking"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
