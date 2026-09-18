import type { HouseholdState } from "@/onboarding/household-query";

function memberLabel(count: number, singular: string, plural = `${singular}s`) {
	return `${count} ${count === 1 ? singular : plural}`;
}

export function formatHouseholdSummary(household: HouseholdState) {
	return [
		memberLabel(household.adults, "adult"),
		memberLabel(household.children, "child", "children"),
		memberLabel(household.toddlers, "toddler"),
	].join(" · ");
}
