import { PackageSearch, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RecommendationNoViableProps {
	reason: string;
	constraints: readonly string[];
	onAdjustRequest: () => void;
	onCheckInventory: () => void;
}

export function RecommendationNoViable({
	reason,
	constraints,
	onAdjustRequest,
	onCheckInventory,
}: RecommendationNoViableProps) {
	return (
		<Card className="bg-soft-pink/40 shadow-none">
			<CardHeader className="space-y-3">
				<PackageSearch className="size-9" aria-hidden="true" />
				<h2 className="font-heading text-3xl leading-tight">
					No good match yet
				</h2>
				<p className="leading-relaxed">{reason}</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{constraints.length > 0 ? (
					<ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
						{constraints.map((constraint) => (
							<li key={constraint}>{constraint}</li>
						))}
					</ul>
				) : null}
				<div className="grid gap-3 sm:grid-cols-2">
					<Button type="button" onClick={onAdjustRequest}>
						<RefreshCcw aria-hidden="true" />
						Adjust request
					</Button>
					<Button type="button" variant="outline" onClick={onCheckInventory}>
						Check inventory
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
