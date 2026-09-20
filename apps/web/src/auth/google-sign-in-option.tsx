import { Button } from "@/components/ui/button";

interface GoogleSignInOptionProps {
	enabled: boolean;
	disabled: boolean;
	onClick: () => void;
}

export function GoogleSignInOption({
	enabled,
	disabled,
	onClick,
}: GoogleSignInOptionProps) {
	if (!enabled) return null;

	return (
		<>
			<div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
				<span>or</span>
			</div>
			<Button
				variant="outline"
				className="w-full rounded-xl border-transparent bg-muted shadow-none"
				type="button"
				disabled={disabled}
				onClick={onClick}
			>
				<span
					className="grid size-6 place-items-center rounded-lg bg-lavender font-black"
					aria-hidden="true"
				>
					G
				</span>
				Continue with Google
			</Button>
		</>
	);
}
