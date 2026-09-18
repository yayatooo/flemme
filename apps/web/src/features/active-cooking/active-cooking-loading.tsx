import { LoadingState } from "@/components/app";

export function ActiveCookingLoading() {
	return (
		<div className="space-y-4 py-8" role="status">
			<p className="font-heading text-2xl">
				Getting your cooking session ready...
			</p>
			<LoadingState rows={3} />
		</div>
	);
}
