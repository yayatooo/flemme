import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppHeaderProps {
	initial?: string;
}

export function AppHeader({ initial = "F" }: AppHeaderProps) {
	return (
		<header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b-2 border-foreground bg-background px-5 py-2 sm:px-6">
			<Link
				to="/app"
				className="font-heading text-2xl leading-none tracking-tight no-underline focus-visible:rounded-sm"
			>
				Flemme<span className="text-primary">.</span>
			</Link>

			<Avatar size="sm" role="img" aria-label="Account">
				<AvatarFallback>{initial}</AvatarFallback>
			</Avatar>
		</header>
	);
}
