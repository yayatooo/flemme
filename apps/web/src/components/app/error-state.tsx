import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface ErrorStateProps {
	title?: string;
	description?: string;
	onRetry?: () => void;
}

export function ErrorState({
	title = "Something went wrong",
	description = "Try again in a moment.",
	onRetry,
}: ErrorStateProps) {
	return (
		<Card className="border-destructive shadow-none" role="alert">
			<CardHeader>
				<div className="mb-2 grid size-12 place-items-center rounded-full border-2 border-foreground bg-destructive text-destructive-foreground">
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
