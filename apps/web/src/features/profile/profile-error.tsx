import { ErrorState } from "@/components/app";

interface ProfileErrorProps {
	onRetry: () => void;
}

export function ProfileError({ onRetry }: ProfileErrorProps) {
	return (
		<ErrorState
			title="Couldn't load your profile"
			description="Your saved account and cooking preferences are still safe. Try again in a moment."
			onRetry={onRetry}
		/>
	);
}
