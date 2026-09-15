import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
	rows?: number;
}

export function LoadingState({ rows = 3 }: LoadingStateProps) {
	const rowIds = Array.from(
		{ length: Math.max(1, rows) },
		(_, index) => `loading-row-${index + 1}`,
	);

	return (
		<div className="space-y-4" role="status" aria-label="Loading content">
			<div className="space-y-2">
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-full" />
			</div>
			<div className="space-y-3">
				{rowIds.map((rowId) => (
					<Skeleton key={rowId} className="h-20 w-full" />
				))}
			</div>
			<span className="sr-only">Loading content</span>
		</div>
	);
}
