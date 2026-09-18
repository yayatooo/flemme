import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
	title?: string;
	description?: string;
	onRetry?: () => void;
	className?: string;
	iconClassName?: string;
}

export function ErrorState({
	title = "Something went wrong",
	description = "Try again in a moment.",
	onRetry,
	className,
	iconClassName,
}: ErrorStateProps) {
	return (
		<Card
			className={cn("border-destructive shadow-none", className)}
			role="alert"
		>
			<CardHeader>
				<div
					className={cn(
						"mb-2 grid size-12 place-items-center rounded-full border-2 border-foreground bg-destructive text-destructive-foreground",
						iconClassName,
					)}
				>
					<TriangleAlert className="size-6" aria-hidden="true" />
				</div>
				<CardTitle>{title}</CardTitle>
				<CardDescription className="leading-relaxed">
					{description}
				</CardDescription>
			</CardHeader>
			{onRetry ? (
				<CardContent>
					<Button type="button" variant="outline" onClick={onRetry}>
						Try again
					</Button>
				</CardContent>
			) : null}
		</Card>
	);
}
