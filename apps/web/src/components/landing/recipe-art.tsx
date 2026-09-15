export function RecipeArt({
	tone,
	className = "",
}: {
	tone: string;
	className?: string;
}) {
	return (
		<div
			className={`relative block h-26 overflow-hidden rounded-3xl border-2 border-foreground ${tone} ${className}`}
			aria-hidden="true"
		>
			<span className="absolute right-[13%] bottom-[13%] block size-[58%] rounded-full border-2 border-foreground bg-background" />
			<span className="absolute right-[28%] bottom-[28%] block size-[28%] rounded-full border-2 border-foreground bg-primary" />
			<span className="absolute top-[8%] left-[13%] block h-[46%] w-[28%] -rotate-18 rounded-[100%_0] border-2 border-foreground bg-secondary" />
		</div>
	);
}
