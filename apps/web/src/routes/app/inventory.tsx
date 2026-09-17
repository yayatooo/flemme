import { createFileRoute } from "@tanstack/react-router";
import { InventoryPage } from "@/features/inventory";

export const Route = createFileRoute("/app/inventory")({
	component: InventoryPage,
});
