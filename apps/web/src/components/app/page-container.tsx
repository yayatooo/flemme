import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
	children: ReactNode;
	className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
	return <div className={cn("px-5 py-6 sm:px-6", className)}>{children}</div>;
}
