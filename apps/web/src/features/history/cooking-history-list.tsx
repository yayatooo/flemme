import type { CookingHistoryItem } from "@flemme/contracts/cooking-history";
import { CookingHistoryCard } from "./cooking-history-card";

interface CookingHistoryListProps {
	items: readonly CookingHistoryItem[];
}

export function CookingHistoryList({ items }: CookingHistoryListProps) {
	return (
		<div className="space-y-4">
			{items.map((item) => (
				<CookingHistoryCard key={item.sessionId} item={item} />
			))}
		</div>
	);
}
