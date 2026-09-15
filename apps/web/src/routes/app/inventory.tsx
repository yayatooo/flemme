import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/app";

export const Route = createFileRoute("/app/inventory")({
	component: InventoryPage,
});

function InventoryPage() {
	return (
		<PageContainer>
			<h1 className="font-heading text-4xl leading-none tracking-tight">
				Inventory
			</h1>
		</PageContainer>
	);
}
