import { LoadingState } from "@/components/app";

export function ActiveCookingLoading() {
	return (
		<div className="space-y-4 py-6 sm:py-8" role="status">
			<p className="rounded-3xl bg-primary/15 p-5 font-heading text-2xl shadow-card">
				Getting your cooking session ready...
			</p>
			<LoadingState rows={3} />
		</div>
	);
}
