import { Link } from "@tanstack/react-router";
import { CookingPot } from "lucide-react";
import { EmptyState } from "@/components/app";
import { Button } from "@/components/ui/button";

export function CookingHistoryEmpty() {
	return (
		<EmptyState
			title="No cooking history yet"
			description="Meals you finish with Flemme will show up here."
			icon={<CookingPot aria-hidden="true" />}
			action={<Button render={<Link to="/app" />}>Start cooking</Button>}
		/>
	);
}
