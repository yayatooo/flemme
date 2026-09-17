import type { FavoriteResponse } from "@flemme/contracts/favorite";
import { FavoriteCard } from "./favorite-card";

interface FavoriteListProps {
	favorites: readonly FavoriteResponse[];
}

export function FavoriteList({ favorites }: FavoriteListProps) {
	return (
		<div className="space-y-4">
			{favorites.map((favorite) => (
				<FavoriteCard key={favorite.id} favorite={favorite} />
			))}
		</div>
	);
}
