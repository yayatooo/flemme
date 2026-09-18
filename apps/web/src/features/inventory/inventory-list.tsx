import type { InventoryItemResponse } from "@flemme/contracts/inventory";
import { InventoryItem } from "./inventory-item";

interface InventoryListProps {
	items: InventoryItemResponse[];
}

export function InventoryList({ items }: InventoryListProps) {
	return (
		<ul className="grid gap-3" aria-label="Inventory ingredients">
			{items.map((item) => (
				<li key={item.id}>
					<InventoryItem item={item} />
				</li>
			))}
		</ul>
	);
}
