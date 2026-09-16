import { LoadingState } from "@/components/app";

export function ActiveCookingLoading() {
	return (
		<div className="space-y-4 px-5 py-8 sm:px-6" role="status">
			<p className="font-heading text-2xl">
				Getting your cooking session ready...
			</p>
			<LoadingState rows={3} />
		</div>
	);
}
