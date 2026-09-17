import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FavoriteLoading() {
	return (
		<div className="space-y-4">
			{["favorite-skeleton-1", "favorite-skeleton-2"].map((id) => (
				<Card key={id} className="space-y-4 p-5 shadow-none">
					<Skeleton className="h-8 w-4/5 rounded-xl" />
					<Skeleton className="h-4 w-2/5 rounded-lg" />
					<Skeleton className="h-14 w-full rounded-xl" />
					<Skeleton className="h-12 w-full rounded-full" />
				</Card>
			))}
			<span className="sr-only">Loading favorites</span>
		</div>
	);
}
