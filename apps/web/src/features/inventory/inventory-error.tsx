import { ErrorState } from "@/components/app";

interface InventoryErrorProps {
	onRetry: () => void;
}

export function InventoryError({ onRetry }: InventoryErrorProps) {
	return (
		<ErrorState
			title="Couldn't load your inventory"
			description="Your saved ingredients are still safe. Try again in a moment."
			onRetry={onRetry}
		/>
	);
}
