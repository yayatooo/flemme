import { Skeleton } from "@/components/ui/skeleton";

export function PreCookingLoading() {
	return (
		<div
			className="space-y-6"
			role="status"
			aria-label="Preparing your cooking plan"
		>
			<p className="font-heading text-2xl">Preparing your cooking plan…</p>
			<div className="space-y-4 rounded-3xl border border-transparent bg-card p-5 shadow-card">
				<Skeleton className="h-7 w-1/3" />
				<Skeleton className="h-16 w-full" />
				<div className="flex gap-3">
					<Skeleton className="h-10 w-28" />
					<Skeleton className="h-10 w-28" />
				</div>
			</div>
			{["ingredients", "preparation", "stages"].map((section) => (
				<div key={section} className="space-y-3">
					<Skeleton className="h-7 w-2/5" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			))}
			<span className="sr-only">
				Flemme is generating the immutable preparation and cooking plan.
			</span>
		</div>
	);
}
