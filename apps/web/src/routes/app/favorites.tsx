import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/app";

export const Route = createFileRoute("/app/favorites")({
	component: FavoritesPage,
});

function FavoritesPage() {
	return (
		<PageContainer>
			<h1 className="font-heading text-4xl leading-none tracking-tight">
				Favorites
			</h1>
		</PageContainer>
	);
}
