import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/app";
import { Button } from "@/components/ui/button";

interface NutritionErrorProps {
	sessionId: string;
	displayName?: string;
	message: string;
	onRetry?: () => void;
}

export function NutritionError({
	sessionId,
	displayName,
	message,
	onRetry,
}: NutritionErrorProps) {
	return (
		<main className="space-y-5 py-4 sm:space-y-6 sm:py-6">
			<Button
				variant="ghost"
				size="sm"
				render={
					<Link
						to="/app/cooking/$sessionId/completion"
						params={{ sessionId }}
					/>
				}
			>
				<ArrowLeft aria-hidden="true" />
				Completion
			</Button>
			<header className="space-y-2 rounded-3xl bg-secondary p-5 shadow-card">
				<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
					Nutrition
				</p>
				<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
					{displayName ?? "Nutrition review"}
				</h1>
			</header>
			<ErrorState
				className="border-destructive/40 bg-card shadow-card"
				iconClassName="rounded-2xl border-transparent"
				title="Couldn't prepare your Nutrition review"
				description={message}
				onRetry={onRetry}
			/>
		</main>
	);
}
