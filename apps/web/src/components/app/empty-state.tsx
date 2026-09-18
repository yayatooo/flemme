import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
	className?: string;
	iconClassName?: string;
}

export function EmptyState({
	title,
	description,
	icon,
	action,
	className,
	iconClassName,
}: EmptyStateProps) {
	return (
		<Card className={cn("shadow-none", className)}>
			<CardHeader className="justify-items-center text-center">
				{icon ? (
					<div
						className={cn(
							"mb-2 grid size-12 place-items-center rounded-full border-2 border-foreground bg-secondary [&_svg]:size-6",
							iconClassName,
						)}
					>
						{icon}
					</div>
				) : null}
				<CardTitle>{title}</CardTitle>
				{description ? (
					<CardDescription className="max-w-sm leading-relaxed">
						{description}
					</CardDescription>
				) : null}
			</CardHeader>
			{action ? (
				<CardContent className="flex justify-center">{action}</CardContent>
			) : null}
		</Card>
	);
}
