import type { CookingHistoryItem } from "@flemme/contracts/cooking-history";
import { CookingHistoryCard } from "./cooking-history-card";

interface CookingHistoryListProps {
	items: readonly CookingHistoryItem[];
}

export function CookingHistoryList({ items }: CookingHistoryListProps) {
	return (
		<div className="grid gap-3">
			{items.map((item) => (
				<CookingHistoryCard key={item.sessionId} item={item} />
			))}
		</div>
	);
}
