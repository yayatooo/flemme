import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";
import { Check } from "lucide-react";

interface EquipmentRequirementsProps {
	equipment: PreCookingOutput["equipment"];
}

export function EquipmentRequirements({
	equipment,
}: EquipmentRequirementsProps) {
	return (
		<section className="space-y-4" aria-labelledby="equipment-heading">
			<header className="space-y-1">
				<h2 id="equipment-heading" className="font-heading text-2xl">
					Equipment
				</h2>
				<p className="text-sm text-muted-foreground">
					Set out the tools the plan calls for.
				</p>
			</header>
			{equipment.length > 0 ? (
				<ul className="grid gap-2 sm:grid-cols-2">
					{equipment.map((item) => (
						<li
							key={item.name}
							className="flex min-w-0 items-center gap-3 rounded-2xl bg-muted/55 px-4 py-3"
						>
							<Check
								className="size-4 shrink-0 text-success-foreground"
								aria-hidden="true"
							/>
							<span className="min-w-0 font-bold break-words">{item.name}</span>
							<span className="ml-auto shrink-0 text-xs text-muted-foreground">
								{item.required ? "Required" : "Optional"}
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">
					No equipment requirements listed.
				</p>
			)}
		</section>
	);
}
