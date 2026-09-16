import type { ActiveCookingChange } from "@flemme/agent/active-cooking-input";
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
import { Textarea } from "@/components/ui/textarea";

const changeKinds: Array<{
	value: ActiveCookingChange["kind"];
	label: string;
}> = [
	{ value: "ingredient", label: "Ingredient" },
	{ value: "equipment", label: "Equipment" },
	{ value: "servings", label: "Servings" },
	{ value: "step", label: "Cooking step" },
	{ value: "other", label: "Other" },
];

interface RecordChangeDialogProps {
	currentStepId: string;
	disabled: boolean;
	isPending: boolean;
	onRecord: (change: ActiveCookingChange) => Promise<boolean>;
}

export function RecordChangeDialog({
	currentStepId,
	disabled,
	isPending,
	onRecord,
}: RecordChangeDialogProps) {
	const [open, setOpen] = useState(false);
	const [kind, setKind] = useState<ActiveCookingChange["kind"]>("ingredient");
	const [description, setDescription] = useState("");
	const [relatesToCurrentStep, setRelatesToCurrentStep] = useState(true);
	const trimmedDescription = description.trim();

	async function submitChange(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!trimmedDescription) return;
		const saved = await onRecord({
			kind,
			description: trimmedDescription,
			...(relatesToCurrentStep ? { relatedStepId: currentStepId } : {}),
		});
		if (saved) {
			setDescription("");
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button type="button" variant="outline" disabled={disabled} />}
			>
				Record a change
			</DialogTrigger>
			<DialogContent>
				<form className="space-y-5" onSubmit={submitChange}>
					<DialogHeader>
						<DialogTitle>What changed?</DialogTitle>
						<DialogDescription>
							The reviewed plan stays unchanged. This note is saved with your
							cooking session.
						</DialogDescription>
					</DialogHeader>
					<label className="grid gap-2 font-extrabold" htmlFor="change-kind">
						Change type
						<select
							id="change-kind"
							value={kind}
							onChange={(event) =>
								setKind(event.target.value as ActiveCookingChange["kind"])
							}
							className="min-h-12 rounded-xl border-2 border-foreground bg-card px-4 text-base font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/70"
						>
							{changeKinds.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label
						className="grid gap-2 font-extrabold"
						htmlFor="change-description"
					>
						Description
						<Textarea
							id="change-description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="For example: Used less chili"
							maxLength={500}
							className="min-h-24"
						/>
					</label>
					<label className="flex min-h-11 items-center gap-3 font-bold">
						<input
							type="checkbox"
							checked={relatesToCurrentStep}
							onChange={(event) =>
								setRelatesToCurrentStep(event.target.checked)
							}
							className="size-5 accent-primary"
						/>
						This change relates to the current step
					</label>
					<DialogFooter>
						<Button type="submit" disabled={!trimmedDescription || isPending}>
							{isPending ? "Saving change..." : "Save change"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
