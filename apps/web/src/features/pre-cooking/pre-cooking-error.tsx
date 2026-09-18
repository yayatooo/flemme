import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/app";
import { Button } from "@/components/ui/button";

interface PreCookingErrorProps {
	message: string;
	onRetry: () => void;
	onBack: () => void;
}

export function PreCookingError({
	message,
	onRetry,
	onBack,
}: PreCookingErrorProps) {
	return (
		<div className="space-y-3">
			<ErrorState
				className="border-destructive/40 bg-card shadow-card"
				iconClassName="rounded-2xl border-transparent"
				title="Couldn't prepare your cooking plan"
				description={message}
				onRetry={onRetry}
			/>
			<Button type="button" variant="ghost" onClick={onBack}>
				<ArrowLeft aria-hidden="true" />
				Back to recommendations
			</Button>
		</div>
	);
}
