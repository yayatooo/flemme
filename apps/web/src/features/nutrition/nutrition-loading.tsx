import { Skeleton } from "@/components/ui/skeleton";

interface NutritionLoadingProps {
	displayName?: string;
}

export function NutritionLoading({ displayName }: NutritionLoadingProps) {
	return (
		<main className="space-y-6 py-6 sm:py-8" aria-busy="true">
			<header className="space-y-2">
				<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
					Nutrition
				</p>
				<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
					{displayName ?? "Your meal"}
				</h1>
			</header>
			<div className="space-y-4" role="status">
				<span className="sr-only">Calculating your meal...</span>
				<Skeleton className="h-64 w-full rounded-3xl" />
				<Skeleton className="h-44 w-full rounded-3xl" />
			</div>
		</main>
	);
}
