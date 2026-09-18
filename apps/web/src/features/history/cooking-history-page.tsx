import { PageContainer } from "@/components/app";
import { Button } from "@/components/ui/button";
import { CookingHistoryEmpty } from "./cooking-history-empty";
import { CookingHistoryError } from "./cooking-history-error";
import { CookingHistoryList } from "./cooking-history-list";
import { CookingHistoryLoading } from "./cooking-history-loading";
import { useCookingHistory } from "./cooking-history-query";

export function CookingHistoryPage() {
	const history = useCookingHistory();
	const items = history.data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<PageContainer className="space-y-5 pt-4 sm:space-y-6 sm:pt-6">
			<header className="space-y-2 rounded-3xl bg-forest p-5 text-background shadow-card">
				<h1 className="font-heading text-3xl leading-none tracking-tight sm:text-4xl">
					Cooking History
				</h1>
				<p className="leading-relaxed text-background/70">
					Your completed meals, all in one place.
				</p>
			</header>

			{history.isPending ? <CookingHistoryLoading /> : null}
			{history.isError && items.length === 0 ? (
				<CookingHistoryError onRetry={() => void history.refetch()} />
			) : null}
			{history.isSuccess && items.length === 0 ? <CookingHistoryEmpty /> : null}
			{items.length > 0 ? <CookingHistoryList items={items} /> : null}

			{history.hasNextPage ? (
				<div className="flex flex-col items-center gap-3">
					{history.isFetchNextPageError ? (
						<p role="alert" className="text-sm font-semibold text-destructive">
							Couldn't load more meals. Try again.
						</p>
					) : null}
					<Button
						type="button"
						variant="outline"
						className="w-full border-transparent bg-card shadow-card sm:w-auto"
						disabled={history.isFetchingNextPage}
						onClick={() => void history.fetchNextPage()}
					>
						{history.isFetchingNextPage ? "Loading…" : "Load more"}
					</Button>
				</div>
			) : null}
		</PageContainer>
	);
}
