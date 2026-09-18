import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CookingControlsProps {
	canGoPrevious: boolean;
	isFinalStep: boolean;
	isPending: boolean;
	onPrevious: () => void;
	onAdvance: () => void;
}

export function CookingControls({
	canGoPrevious,
	isFinalStep,
	isPending,
	onPrevious,
	onAdvance,
}: CookingControlsProps) {
	return (
		<div className="rounded-3xl bg-card p-3 shadow-card">
			<div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3">
				<Button
					type="button"
					variant="outline"
					size="lg"
					disabled={!canGoPrevious || isPending}
					onClick={onPrevious}
				>
					<ArrowLeft aria-hidden="true" />
					Previous
				</Button>
				<Button
					type="button"
					size="lg"
					variant="outline"
					className="border-transparent bg-forest text-card! shadow-none hover:bg-forest/90 [&_svg]:text-card!"
					disabled={isPending}
					onClick={onAdvance}
				>
					{isFinalStep ? (
						<>
							Finish cooking
							<Check aria-hidden="true" />
						</>
					) : (
						<>
							Next step
							<ArrowRight aria-hidden="true" />
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
