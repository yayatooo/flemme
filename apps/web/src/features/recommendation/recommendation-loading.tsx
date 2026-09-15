import { Skeleton } from "@/components/ui/skeleton";

export function RecommendationLoading() {
	return (
		<div
			className="space-y-5"
			role="status"
			aria-label="Finding recommendations"
		>
			<p className="font-heading text-2xl">Finding something that fits…</p>
			{["first", "second"].map((row) => (
				<div
					key={row}
					className="space-y-4 rounded-3xl border-2 border-foreground bg-card p-5"
				>
					<Skeleton className="h-8 w-2/3" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			))}
			<span className="sr-only">
				Flemme is preparing recipe recommendations.
			</span>
		</div>
	);
}
