import { PageContainer } from "@/components/app";
import { Button } from "@/components/ui/button";
import { FavoriteEmpty } from "./favorite-empty";
import { FavoriteError } from "./favorite-error";
import { FavoriteList } from "./favorite-list";
import { FavoriteLoading } from "./favorite-loading";
import { useFavorites } from "./favorite-query";

export function FavoritesPage() {
	const favoritesQuery = useFavorites();
	const favorites =
		favoritesQuery.data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<PageContainer>
			<header className="space-y-2">
				<h1 className="font-heading text-4xl leading-none tracking-tight">
					Favorites
				</h1>
				<p className="leading-relaxed text-muted-foreground">
					Meals you wanted to keep.
				</p>
			</header>

			{favoritesQuery.isPending ? <FavoriteLoading /> : null}
			{favoritesQuery.isError && favorites.length === 0 ? (
				<FavoriteError onRetry={() => void favoritesQuery.refetch()} />
			) : null}
			{favoritesQuery.isSuccess && favorites.length === 0 ? (
				<FavoriteEmpty />
			) : null}
			{favorites.length > 0 ? <FavoriteList favorites={favorites} /> : null}

			{favoritesQuery.hasNextPage ? (
				<div className="flex flex-col items-center gap-3">
					{favoritesQuery.isFetchNextPageError ? (
						<p role="alert" className="text-sm font-semibold text-destructive">
							Couldn't load more favorites. Try again.
						</p>
					) : null}
					<Button
						type="button"
						variant="outline"
						disabled={favoritesQuery.isFetchingNextPage}
						onClick={() => void favoritesQuery.fetchNextPage()}
					>
						{favoritesQuery.isFetchingNextPage ? "Loading…" : "Load more"}
					</Button>
				</div>
			) : null}
		</PageContainer>
	);
}
