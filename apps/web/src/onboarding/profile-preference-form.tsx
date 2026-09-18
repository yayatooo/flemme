import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	buildProfilePayload,
	cookingPreferenceOptions,
	foodPreferenceOptions,
	type ProfileState,
	preferenceOptionsWithPersistedValues,
	togglePreferenceValue,
} from "./profile-query";

interface ProfilePreferenceFormProps {
	initialFoodPreferences: string[];
	initialCookingPreferences: string[];
	disabled: boolean;
	errorMessage?: string | null;
	submitLabel?: string;
	onSubmit: (state: ProfileState) => void;
	onSkip?: () => void;
}

export function ProfilePreferenceForm({
	initialFoodPreferences,
	initialCookingPreferences,
	disabled,
	errorMessage,
	submitLabel = "Save preferences",
	onSubmit,
	onSkip,
}: ProfilePreferenceFormProps) {
	const [foodPreferences, setFoodPreferences] = useState(
		initialFoodPreferences,
	);
	const [cookingPreferences, setCookingPreferences] = useState(
		initialCookingPreferences,
	);
	const visibleFoodOptions = preferenceOptionsWithPersistedValues(
		foodPreferenceOptions,
		foodPreferences,
	);
	const visibleCookingOptions = preferenceOptionsWithPersistedValues(
		cookingPreferenceOptions,
		cookingPreferences,
	);

	return (
		<form
			className="space-y-6"
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit(buildProfilePayload(foodPreferences, cookingPreferences));
			}}
		>
			<PreferenceGroup
				title="Food and cuisine references"
				description="Signals Flemme can use when ranking future meal ideas."
				options={visibleFoodOptions}
				selectedValues={foodPreferences}
				disabled={disabled}
				onToggle={(value) =>
					setFoodPreferences((current) => togglePreferenceValue(current, value))
				}
			/>
			<PreferenceGroup
				title="Cooking preferences"
				description="The styles that usually make cooking work for you."
				options={visibleCookingOptions}
				selectedValues={cookingPreferences}
				disabled={disabled}
				onToggle={(value) =>
					setCookingPreferences((current) =>
						togglePreferenceValue(current, value),
					)
				}
			/>
			{errorMessage ? (
				<p className="text-sm font-bold text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}
			<div className="grid gap-3 sm:grid-cols-2">
				<Button type="submit" disabled={disabled} className="w-full">
					{disabled ? "Saving…" : submitLabel}
				</Button>
				{onSkip ? (
					<Button
						type="button"
						variant="outline"
						disabled={disabled}
						onClick={onSkip}
						className="w-full"
					>
						Skip for now
					</Button>
				) : null}
			</div>
		</form>
	);
}

function PreferenceGroup({
	title,
	description,
	options,
	selectedValues,
	disabled,
	onToggle,
}: {
	title: string;
	description: string;
	options: ReadonlyArray<{ value: string; label: string }>;
	selectedValues: ReadonlyArray<string>;
	disabled: boolean;
	onToggle: (value: string) => void;
}) {
	return (
		<fieldset className="space-y-3">
			<legend className="text-base font-extrabold">{title}</legend>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>
			<div className="flex flex-wrap gap-2">
				{options.map((option) => {
					const selected = selectedValues.includes(option.value);
					return (
						<Button
							key={option.value}
							type="button"
							variant={selected ? "secondary" : "outline"}
							size="sm"
							aria-pressed={selected}
							disabled={disabled}
							onClick={() => onToggle(option.value)}
							className="max-w-full whitespace-normal"
						>
							{selected ? <Check aria-hidden="true" /> : null}
							<span className="break-words">{option.label}</span>
						</Button>
					);
				})}
			</div>
		</fieldset>
	);
}
