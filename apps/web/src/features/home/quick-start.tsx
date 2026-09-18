import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { quickStartOptions } from "./quick-start-options";

interface QuickStartProps {
	selectedRequest: string;
	onSelect: (request: string) => void;
}

export function QuickStart({ selectedRequest, onSelect }: QuickStartProps) {
	const tileClasses = [
		"bg-secondary hover:bg-secondary/85",
		"bg-mustard hover:bg-mustard/85",
		"bg-lavender hover:bg-lavender/85",
		"bg-soft-pink hover:bg-soft-pink/85",
	] as const;

	return (
		<section aria-labelledby="quick-start-heading" className="space-y-3">
			<h2
				id="quick-start-heading"
				className="text-xs font-extrabold tracking-[0.14em] uppercase"
			>
				Quick Start
			</h2>
			<div className="grid grid-cols-2 gap-3">
				{quickStartOptions.map((option, index) => {
					const Icon = option.icon;
					const selected = selectedRequest === option.request;
					return (
						<Button
							key={option.request}
							type="button"
							variant="ghost"
							className={cn(
								"h-auto min-h-28 flex-col items-start justify-between gap-4 rounded-3xl border border-transparent p-4 text-left whitespace-normal shadow-card hover:border-transparent",
								tileClasses[index],
								selected &&
									"ring-3 ring-foreground/20 ring-offset-2 ring-offset-background",
							)}
							aria-pressed={selected}
							onClick={() => onSelect(option.request)}
						>
							<span className="grid size-9 place-items-center rounded-full bg-card/75">
								<Icon className="size-4" aria-hidden="true" />
							</span>
							<span className="max-w-[11rem] leading-tight">
								{option.label}
							</span>
						</Button>
					);
				})}
			</div>
		</section>
	);
}
