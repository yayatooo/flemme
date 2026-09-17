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
		<PageContainer>
			<header className="space-y-2">
				<h1 className="font-heading text-4xl leading-none tracking-tight">
					Cooking History
				</h1>
				<p className="leading-relaxed text-muted-foreground">
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
