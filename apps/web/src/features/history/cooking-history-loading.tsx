import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CookingHistoryLoading() {
	return (
		<div className="grid gap-3">
			{["history-skeleton-1", "history-skeleton-2"].map((id) => (
				<Card key={id} className="space-y-4 border-transparent p-5 shadow-card">
					<Skeleton className="h-8 w-4/5 rounded-xl" />
					<Skeleton className="h-4 w-2/5 rounded-lg" />
					<Skeleton className="h-14 w-full rounded-xl" />
					<Skeleton className="h-12 w-full rounded-xl sm:w-36" />
				</Card>
			))}
			<span className="sr-only">Loading cooking history</span>
		</div>
	);
}
