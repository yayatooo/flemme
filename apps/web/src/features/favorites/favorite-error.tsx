import { ErrorState } from "@/components/app";

interface FavoriteErrorProps {
	onRetry: () => void;
}

export function FavoriteError({ onRetry }: FavoriteErrorProps) {
	return (
		<ErrorState
			title="Couldn't load your favorites"
			description="Your saved meals are still safe. Try again in a moment."
			onRetry={onRetry}
		/>
	);
}
