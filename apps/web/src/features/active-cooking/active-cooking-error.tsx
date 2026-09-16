import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/app";
import { Button } from "@/components/ui/button";

interface ActiveCookingErrorProps {
	message: string;
	onRetry?: () => void;
}

export function ActiveCookingError({
	message,
	onRetry,
}: ActiveCookingErrorProps) {
	return (
		<div className="space-y-4 px-5 py-8 sm:px-6">
			<Button variant="ghost" size="sm" render={<Link to="/app" />}>
				<ArrowLeft aria-hidden="true" />
				Home
			</Button>
			<ErrorState
				title="Couldn't restore cooking session"
				description={message}
				onRetry={onRetry}
			/>
		</div>
	);
}
