import type { ReactNode } from "react";
import { headingClass, kickerClass } from "./styles";

export function SectionHeading({
	kicker,
	children,
	description,
}: {
	kicker: string;
	children: ReactNode;
	description: string;
}) {
	return (
		<div className="mb-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20">
			<div>
				<p className={kickerClass}>{kicker}</p>
				<h2 className={headingClass}>{children}</h2>
			</div>
			<p className="m-0 max-w-lg leading-[1.7] text-muted-foreground">
				{description}
			</p>
		</div>
	);
}
