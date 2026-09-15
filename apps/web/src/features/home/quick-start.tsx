import { Button } from "@/components/ui/button";
import { quickStartOptions } from "./quick-start-options";

interface QuickStartProps {
	selectedRequest: string;
	onSelect: (request: string) => void;
}

export function QuickStart({ selectedRequest, onSelect }: QuickStartProps) {
	return (
		<section aria-labelledby="quick-start-heading" className="space-y-3">
			<h2 id="quick-start-heading" className="font-heading text-2xl">
				Quick Start
			</h2>
			<div className="grid grid-cols-2 gap-3">
				{quickStartOptions.map((option) => {
					const Icon = option.icon;
					const selected = selectedRequest === option.request;
					return (
						<Button
							key={option.request}
							type="button"
							variant={selected ? "secondary" : "outline"}
							className="min-h-14 h-auto flex-col gap-1 px-3 py-2 text-center whitespace-normal"
							aria-pressed={selected}
							onClick={() => onSelect(option.request)}
						>
							<Icon aria-hidden="true" />
							{option.label}
						</Button>
					);
				})}
			</div>
		</section>
	);
}
