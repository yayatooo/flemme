import { Users } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { HouseholdForm } from "@/onboarding/household-form";
import type { HouseholdState } from "@/onboarding/household-query";
import { formatHouseholdSummary } from "./household-summary";
import {
	householdMutationErrorMessage,
	useSaveHouseholdMutation,
} from "./profile-mutations";

interface HouseholdSectionProps {
	household: HouseholdState;
}

export function HouseholdSection({ household }: HouseholdSectionProps) {
	const [open, setOpen] = useState(false);
	const submitLock = useRef(false);
	const saveHousehold = useSaveHouseholdMutation();

	function changeOpen(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) saveHousehold.reset();
	}

	async function save(nextHousehold: HouseholdState) {
		if (submitLock.current) return;
		submitLock.current = true;
		try {
			await saveHousehold.mutateAsync(nextHousehold);
			setOpen(false);
		} catch {
			// Keep counts and the dialog available for retry.
		} finally {
			submitLock.current = false;
		}
	}

	return (
		<section aria-labelledby="household-title">
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle id="household-title">Household</CardTitle>
					<CardDescription>Who you usually cook for.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="break-words text-base font-extrabold">
						{formatHouseholdSummary(household)}
					</p>
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => setOpen(true)}
					>
						<Users aria-hidden="true" />
						Edit household
					</Button>
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={changeOpen}>
				<DialogContent className="max-h-[min(90dvh,44rem)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit household</DialogTitle>
						<DialogDescription>
							Future recommendations and pre-cooking plans use these counts.
						</DialogDescription>
					</DialogHeader>
					<HouseholdForm
						key={String(open)}
						initialHousehold={household}
						disabled={saveHousehold.isPending}
						errorMessage={
							saveHousehold.isError ? householdMutationErrorMessage() : null
						}
						onSubmit={(nextHousehold) => void save(nextHousehold)}
					/>
				</DialogContent>
			</Dialog>
		</section>
	);
}
