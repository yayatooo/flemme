import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface RecentCookingSummary {
	id: string;
	recipeName: string;
	nutritionSummary?: string;
	isFavorite?: boolean;
}

interface RecentCookingProps {
	items: readonly RecentCookingSummary[];
	isLoading?: boolean;
	error?: string | null;
	onRetry?: () => void;
}

export function RecentCooking({
	items,
	isLoading = false,
	error,
	onRetry,
}: RecentCookingProps) {
	const previewItems = items.slice(0, 3);

	return (
		<section aria-labelledby="recent-cooking-heading" className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<h2
					id="recent-cooking-heading"
					className="text-xs font-extrabold tracking-[0.14em] uppercase"
				>
					Recent Cooking
				</h2>
				<Button variant="ghost" size="sm" render={<Link to="/app/history" />}>
					View all
					<ArrowRight aria-hidden="true" />
				</Button>
			</div>

			{isLoading ? <LoadingState rows={2} /> : null}
			{!isLoading && error ? (
				<ErrorState
					title="Couldn't load recent cooking"
					description="Try again in a moment. You can still start a new cooking request."
					onRetry={onRetry}
				/>
			) : null}
			{!isLoading && !error && previewItems.length === 0 ? (
				<p className="rounded-3xl border border-dashed border-border bg-card/55 px-5 py-6 text-sm leading-relaxed text-muted-foreground">
					Meals you finish will appear here.
				</p>
			) : null}
			{!isLoading && !error && previewItems.length > 0 ? (
				<div className="space-y-3">
					{previewItems.map((item) => (
						<Card
							key={item.id}
							size="sm"
							className="border-transparent shadow-card"
						>
							<CardHeader className="grid grid-cols-[1fr_auto] items-start">
								<h3 className="font-heading text-xl leading-tight">
									{item.recipeName}
								</h3>
								{item.isFavorite ? (
									<span aria-label="Favorite" role="img">
										<Heart className="size-5 fill-primary text-foreground" />
									</span>
								) : null}
							</CardHeader>
							{item.nutritionSummary ? (
								<CardContent>
									<Badge variant="outline">{item.nutritionSummary}</Badge>
								</CardContent>
							) : null}
						</Card>
					))}
				</div>
			) : null}
		</section>
	);
}
