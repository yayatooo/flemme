import { SlidersHorizontal } from "lucide-react";
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
import { ProfilePreferenceForm } from "@/onboarding/profile-preference-form";
import {
	cookingPreferenceOptions,
	foodPreferenceOptions,
	type ProfileState,
} from "@/onboarding/profile-query";
import {
	preferenceMutationErrorMessage,
	useSavePreferencesMutation,
} from "./profile-mutations";

interface CookingPreferencesSectionProps {
	profile: ProfileState;
}

export function CookingPreferencesSection({
	profile,
}: CookingPreferencesSectionProps) {
	const [open, setOpen] = useState(false);
	const submitLock = useRef(false);
	const savePreferences = useSavePreferencesMutation();
	const preferences = [
		...profile.foodPreferences.map((value) => ({
			key: `food:${value}`,
			label:
				foodPreferenceOptions.find((option) => option.value === value)?.label ??
				value,
		})),
		...profile.cookingPreferences.map((value) => ({
			key: `cooking:${value}`,
			label:
				cookingPreferenceOptions.find((option) => option.value === value)
					?.label ?? value,
		})),
	];

	function changeOpen(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) savePreferences.reset();
	}

	async function save(nextProfile: ProfileState) {
		if (submitLock.current) return;
		submitLock.current = true;
		try {
			await savePreferences.mutateAsync(nextProfile);
			setOpen(false);
		} catch {
			// Keep the dialog and controlled selections intact for retry.
		} finally {
			submitLock.current = false;
		}
	}

	return (
		<section aria-labelledby="cooking-preferences-title">
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle id="cooking-preferences-title">
						Cooking preferences
					</CardTitle>
					<CardDescription className="leading-relaxed">
						Flexible signals Flemme uses to rank future recommendations—not hard
						filters.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{preferences.length > 0 ? (
						<ul
							className="flex flex-wrap gap-2"
							aria-label="Saved cooking preferences"
						>
							{preferences.map((preference) => (
								<li
									key={preference.key}
									className="max-w-full break-words rounded-full border-2 border-foreground bg-accent px-3 py-2 text-sm font-bold"
								>
									{preference.label}
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm leading-relaxed text-muted-foreground">
							No preferences selected yet. Flemme can still recommend across
							cuisines.
						</p>
					)}
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => setOpen(true)}
					>
						<SlidersHorizontal aria-hidden="true" />
						Edit preferences
					</Button>
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={changeOpen}>
				<DialogContent className="max-h-[min(90dvh,44rem)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit cooking preferences</DialogTitle>
						<DialogDescription>
							Changes apply to future recommendations. Existing cooking sessions
							stay unchanged.
						</DialogDescription>
					</DialogHeader>
					<ProfilePreferenceForm
						key={String(open)}
						initialFoodPreferences={profile.foodPreferences}
						initialCookingPreferences={profile.cookingPreferences}
						disabled={savePreferences.isPending}
						errorMessage={
							savePreferences.isError ? preferenceMutationErrorMessage() : null
						}
						onSubmit={(nextProfile) => void save(nextProfile)}
					/>
				</DialogContent>
			</Dialog>
		</section>
	);
}
