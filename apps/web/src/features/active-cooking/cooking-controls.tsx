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
		<div className="rounded-3xl border-2 border-foreground bg-background p-3 shadow-hard">
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
