import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/app";
import { Button } from "@/components/ui/button";

interface CompletionErrorProps {
	displayName?: string;
	message: string;
	onRetry?: () => void;
}

export function CompletionError({
	displayName,
	message,
	onRetry,
}: CompletionErrorProps) {
	return (
		<main className="space-y-6 py-6 sm:py-8">
			<Button variant="ghost" size="sm" render={<Link to="/app" />}>
				<ArrowLeft aria-hidden="true" />
				Home
			</Button>
			<header className="space-y-2">
				<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
					Completion
				</p>
				<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
					{displayName ?? "Cooking review"}
				</h1>
			</header>
			<ErrorState
				title="Couldn't prepare your review"
				description={message}
				onRetry={onRetry}
			/>
		</main>
	);
}
