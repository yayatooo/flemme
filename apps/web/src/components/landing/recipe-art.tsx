export function RecipeArt({
	tone,
	className = "",
}: {
	tone: string;
	className?: string;
}) {
	return (
		<div
			className={`relative block h-26 overflow-hidden rounded-2xl border border-border ${tone} ${className}`}
			aria-hidden="true"
		>
			<span className="absolute right-[13%] bottom-[13%] block size-[58%] rounded-full border border-border bg-background" />
			<span className="absolute right-[28%] bottom-[28%] block size-[28%] rounded-full border border-border bg-primary" />
			<span className="absolute top-[8%] left-[13%] block h-[46%] w-[28%] rounded-[100%_0] border border-border bg-secondary" />
		</div>
	);
}
