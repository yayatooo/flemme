import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/app";
import { Button } from "@/components/ui/button";

export function FavoriteEmpty() {
	return (
		<EmptyState
			className="border-transparent bg-soft-pink/45 shadow-card"
			iconClassName="rounded-2xl border-transparent bg-card/75"
			title="No favorites yet"
			description="Save meals you want to cook again."
			icon={<Heart aria-hidden="true" />}
			action={<Button render={<Link to="/app" />}>Start cooking</Button>}
		/>
	);
}
