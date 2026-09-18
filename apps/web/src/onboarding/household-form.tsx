import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	type HouseholdCategory,
	type HouseholdState,
	householdMemberCount,
	MAX_HOUSEHOLD_COUNT,
	updateHouseholdCount,
} from "./household-query";

interface HouseholdFormProps {
	initialHousehold: HouseholdState;
	disabled: boolean;
	errorMessage?: string | null;
	submitLabel?: string;
	onSubmit: (household: HouseholdState) => void;
}

export function HouseholdForm({
	initialHousehold,
	disabled,
	errorMessage,
	submitLabel = "Save household",
	onSubmit,
}: HouseholdFormProps) {
	const [household, setHousehold] = useState(initialHousehold);
	const total = householdMemberCount(household);
	const invalid = total === 0;

	return (
		<form
			className="space-y-5"
			onSubmit={(event) => {
				event.preventDefault();
				if (!invalid) onSubmit(household);
			}}
		>
			<div className="space-y-3">
				<HouseholdStepper
					category="adults"
					label="Adults"
					description="Usually eats a regular portion"
					count={household.adults}
					disabled={disabled}
					onChange={(delta) =>
						setHousehold((current) =>
							updateHouseholdCount(current, "adults", delta),
						)
					}
				/>
				<HouseholdStepper
					category="children"
					label="Children"
					description="Smaller, family-friendly meals"
					count={household.children}
					disabled={disabled}
					onChange={(delta) =>
						setHousehold((current) =>
							updateHouseholdCount(current, "children", delta),
						)
					}
				/>
				<HouseholdStepper
					category="toddlers"
					label="Toddlers"
					description="Younger household members"
					count={household.toddlers}
					disabled={disabled}
					onChange={(delta) =>
						setHousehold((current) =>
							updateHouseholdCount(current, "toddlers", delta),
						)
					}
				/>
			</div>
			<p
				className={`text-center text-sm font-bold ${invalid ? "text-destructive" : "text-muted-foreground"}`}
				aria-live="polite"
			>
				{invalid
					? "Add at least one household member."
					: `${total} ${total === 1 ? "person" : "people"} in your household`}
			</p>
			{errorMessage ? (
				<p className="text-sm font-bold text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}
			<Button
				type="submit"
				disabled={disabled || invalid}
				className="w-full rounded-xl"
			>
				{disabled ? "Saving…" : submitLabel}
			</Button>
		</form>
	);
}

interface HouseholdStepperProps {
	category: HouseholdCategory;
	label: string;
	description: string;
	count: number;
	disabled: boolean;
	onChange: (delta: -1 | 1) => void;
}

function HouseholdStepper({
	category,
	label,
	description,
	count,
	disabled,
	onChange,
}: HouseholdStepperProps) {
	return (
		<section
			className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-muted/55 p-3 shadow-control"
			aria-labelledby={`${category}-label`}
		>
			<div className="min-w-0">
				<h3 id={`${category}-label`} className="font-extrabold">
					{label}
				</h3>
				<p className="text-xs leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
			<div className="grid grid-cols-[2.75rem_2.25rem_2.75rem] items-center gap-1">
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					className="rounded-xl"
					aria-label={`Decrease ${category}`}
					disabled={disabled || count === 0}
					onClick={() => onChange(-1)}
				>
					<Minus aria-hidden="true" />
				</Button>
				<output
					className="text-center text-lg font-black"
					aria-label={`${label} count`}
				>
					{count}
				</output>
				<Button
					type="button"
					variant="secondary"
					size="icon-sm"
					className="rounded-xl"
					aria-label={`Increase ${category}`}
					disabled={disabled || count === MAX_HOUSEHOLD_COUNT}
					onClick={() => onChange(1)}
				>
					<Plus aria-hidden="true" />
				</Button>
			</div>
		</section>
	);
}
