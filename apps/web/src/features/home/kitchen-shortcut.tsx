import { Link } from "@tanstack/react-router";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function KitchenShortcut() {
	return (
		<Card className="border-transparent bg-secondary shadow-card">
			<CardHeader className="grid grid-cols-[auto_1fr] items-center gap-x-3">
				<div className="row-span-2 grid size-11 place-items-center rounded-full bg-card/75">
					<PackageOpen className="size-5" aria-hidden="true" />
				</div>
				<h2 className="font-heading text-2xl leading-tight">Your Kitchen</h2>
				<p className="text-sm text-muted-foreground">Manage your ingredients</p>
			</CardHeader>
			<CardContent>
				<Button
					variant="ghost"
					className="w-full border-transparent bg-card/75 hover:border-transparent hover:bg-card"
					render={<Link to="/app/inventory" />}
				>
					View inventory
					<ArrowRight aria-hidden="true" />
				</Button>
			</CardContent>
		</Card>
	);
}
