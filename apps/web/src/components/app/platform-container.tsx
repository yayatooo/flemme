import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type PlatformContainerProps = ComponentProps<"div">;

export function PlatformContainer({
	className,
	...props
}: PlatformContainerProps) {
	return (
		<div
			data-slot="platform-container"
			className={cn(
				"container mx-auto w-full max-w-xl px-4 sm:px-6",
				className,
			)}
			{...props}
		/>
	);
}
