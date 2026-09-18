import { Skeleton } from "@/components/ui/skeleton";

interface CompletionLoadingProps {
	displayName?: string;
}

export function CompletionLoading({ displayName }: CompletionLoadingProps) {
	return (
		<main className="space-y-6 py-6 sm:py-8" aria-busy="true">
			<header className="space-y-2">
				<p className="text-xs font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
					Completion
				</p>
				<h1 className="font-heading text-3xl leading-tight sm:text-4xl">
					{displayName ?? "Your cooking session"}
				</h1>
			</header>
			<div className="space-y-4" role="status">
				<span className="sr-only">Preparing your Completion review...</span>
				<Skeleton className="h-36 w-full rounded-3xl" />
				<Skeleton className="h-48 w-full rounded-3xl" />
				<Skeleton className="h-32 w-full rounded-3xl" />
			</div>
		</main>
	);
}
