import { CircleAlert, Heart, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	favoriteMutationErrorMessage,
	useCreateFavoriteMutation,
} from "./favorite-mutations";
import { useFavoriteBySession } from "./favorite-query";

type FavoriteActionState =
	| { status: "checking" }
	| { status: "available"; onAction: () => void }
	| { status: "saving" }
	| { status: "saved" }
	| { status: "check-error"; onAction: () => void }
	| { status: "save-error"; message: string; onAction: () => void };

interface FavoriteActionViewProps {
	state: FavoriteActionState;
}

export function FavoriteActionView({ state }: FavoriteActionViewProps) {
	const isSaved = state.status === "saved";
	const description = isSaved
		? "This completed meal is saved in your Favorites library."
		: "Save this completed meal without changing its recipe, Nutrition, or cooking history.";

	return (
		<section
			className="space-y-3 border-t-2 pt-6"
			aria-labelledby="favorite-action-title"
		>
			<div className="flex items-start gap-3">
				<Heart
					className="mt-0.5 size-6 shrink-0"
					fill={isSaved ? "currentColor" : "none"}
					aria-hidden="true"
				/>
				<div className="min-w-0 space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h2 id="favorite-action-title" className="font-heading text-xl">
							{isSaved ? "Favorite saved" : "Save your favorite"}
						</h2>
						{isSaved ? <Badge variant="secondary">Saved</Badge> : null}
					</div>
					<p
						id="favorite-action-description"
						className="text-sm leading-relaxed text-muted-foreground"
					>
						{description}
					</p>
				</div>
			</div>

			{state.status === "check-error" || state.status === "save-error" ? (
				<div
					className="flex items-start gap-2 rounded-2xl border-2 border-destructive/60 bg-destructive/10 p-3 text-sm"
					role="alert"
				>
					<CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<p>
						{state.status === "check-error"
							? "Flemme couldn't check whether this meal is already saved. Your completed meal is safe."
							: state.message}
					</p>
				</div>
			) : null}

			{state.status === "checking" ? (
				<Button className="w-full" size="lg" disabled aria-live="polite">
					<LoaderCircle className="animate-spin" aria-hidden="true" />
					Checking favorites...
				</Button>
			) : state.status === "saving" ? (
				<Button className="w-full" size="lg" disabled aria-live="polite">
					<LoaderCircle className="animate-spin" aria-hidden="true" />
					Saving...
				</Button>
			) : state.status === "saved" ? (
				<Button className="w-full" size="lg" variant="secondary" disabled>
					<Heart fill="currentColor" aria-hidden="true" />
					Saved to favorites
				</Button>
			) : (
				<Button
					type="button"
					size="lg"
					className="w-full"
					onClick={state.onAction}
					aria-describedby="favorite-action-description"
				>
					<Heart aria-hidden="true" />
					{state.status === "available"
						? "Save to favorites"
						: state.status === "check-error"
							? "Check again"
							: "Try saving again"}
				</Button>
			)}
		</section>
	);
}

interface FavoriteActionProps {
	sessionId: string;
}

export function FavoriteAction({ sessionId }: FavoriteActionProps) {
	const favoriteQuery = useFavoriteBySession(sessionId);
	const createMutation = useCreateFavoriteMutation(sessionId);

	if (favoriteQuery.isPending) {
		return <FavoriteActionView state={{ status: "checking" }} />;
	}
	if (favoriteQuery.isError) {
		return (
			<FavoriteActionView
				state={{
					status: "check-error",
					onAction: () => void favoriteQuery.refetch(),
				}}
			/>
		);
	}
	if (favoriteQuery.data) {
		return <FavoriteActionView state={{ status: "saved" }} />;
	}
	if (createMutation.isPending) {
		return <FavoriteActionView state={{ status: "saving" }} />;
	}
	if (createMutation.isError) {
		return (
			<FavoriteActionView
				state={{
					status: "save-error",
					message: favoriteMutationErrorMessage(createMutation.error),
					onAction: () => createMutation.mutate(),
				}}
			/>
		);
	}
	return (
		<FavoriteActionView
			state={{ status: "available", onAction: () => createMutation.mutate() }}
		/>
	);
}
