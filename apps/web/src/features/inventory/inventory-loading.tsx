import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryLoading() {
	return (
		<div className="space-y-3">
			{[
				"inventory-skeleton-1",
				"inventory-skeleton-2",
				"inventory-skeleton-3",
			].map((id) => (
				<Card key={id} className="space-y-3 p-5 shadow-none">
					<Skeleton className="h-6 w-3/5 rounded-lg" />
					<Skeleton className="h-4 w-2/5 rounded-lg" />
				</Card>
			))}
			<span className="sr-only">Loading inventory</span>
		</div>
	);
}
