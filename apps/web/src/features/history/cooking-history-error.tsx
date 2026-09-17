import { ErrorState } from "@/components/app";

interface CookingHistoryErrorProps {
	onRetry: () => void;
}

export function CookingHistoryError({ onRetry }: CookingHistoryErrorProps) {
	return (
		<ErrorState
			title="Couldn't load your cooking history"
			description="Your completed meals are still safe. Try again in a moment."
			onRetry={onRetry}
		/>
	);
}
