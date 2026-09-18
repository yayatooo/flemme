import { PackageOpen, Plus } from "lucide-react";
import { EmptyState } from "@/components/app";
import { Button } from "@/components/ui/button";

interface InventoryEmptyProps {
	onAdd: () => void;
}

export function InventoryEmpty({ onAdd }: InventoryEmptyProps) {
	return (
		<EmptyState
			className="border-transparent bg-card shadow-card"
			iconClassName="rounded-2xl border-transparent bg-secondary"
			title="Your inventory is empty"
			description="Add the ingredients you have so Flemme can make better recommendations."
			icon={<PackageOpen aria-hidden="true" />}
			action={
				<Button type="button" onClick={onAdd}>
					<Plus aria-hidden="true" />
					Add ingredient
				</Button>
			}
		/>
	);
}
