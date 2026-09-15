import type { PreCookingOutput } from "@flemme/agent/pre-cooking-output";
import { Badge } from "@/components/ui/badge";

type TimingLevel = NonNullable<
	PreCookingOutput["preparationSteps"][number]["timing"]
>["level"];

const timingLabels: Record<TimingLevel, string> = {
	"very-short": "Very quick",
	short: "Quick",
	medium: "A little time",
	long: "Takes time",
};

interface TimingBadgeProps {
	level: TimingLevel;
}

export function TimingBadge({ level }: TimingBadgeProps) {
	return (
		<Badge variant="outline" className="bg-accent/45">
			{timingLabels[level]}
		</Badge>
	);
}
