import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileLoading() {
	return (
		<div className="space-y-5" aria-busy="true">
			<Card className="space-y-4 p-5 shadow-none">
				<div className="flex items-center gap-4">
					<Skeleton className="size-16 shrink-0 rounded-full" />
					<div className="min-w-0 flex-1 space-y-3">
						<Skeleton className="h-6 w-2/3 rounded-lg" />
						<Skeleton className="h-4 w-full rounded-lg" />
					</div>
				</div>
				<Skeleton className="h-12 w-full rounded-xl" />
			</Card>
			{["profile-preferences", "profile-household"].map((id) => (
				<Card key={id} className="space-y-3 p-5 shadow-none">
					<Skeleton className="h-6 w-1/2 rounded-lg" />
					<Skeleton className="h-4 w-full rounded-lg" />
					<Skeleton className="h-11 w-2/3 rounded-full" />
				</Card>
			))}
			<span className="sr-only">Loading profile</span>
		</div>
	);
}
