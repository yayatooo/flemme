import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { headingClass, kickerClass } from "./styles";

export function SectionHeading({
	kicker,
	children,
	description,
	compact = false,
}: {
	kicker: string;
	children: ReactNode;
	description: string;
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"grid lg:grid-cols-[1.35fr_0.65fr] lg:items-end",
				compact ? "mb-8 gap-4 lg:mb-6 lg:gap-12" : "mb-10 gap-5 lg:gap-16",
			)}
		>
			<div>
				<p className={kickerClass}>{kicker}</p>
				<h2
					className={cn(
						headingClass,
						compact && "text-[clamp(2.5rem,6vw,3.5rem)]",
					)}
				>
					{children}
				</h2>
			</div>
			<p className="m-0 max-w-lg leading-[1.7] text-muted-foreground">
				{description}
			</p>
		</div>
	);
}
