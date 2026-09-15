import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-foreground bg-clip-padding text-sm font-extrabold transition-[transform,box-shadow,background-color] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-x-1 active:not-aria-[haspopup]:translate-y-1 active:not-aria-[haspopup]:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[6px_6px_0_var(--ink)]",
				secondary:
					"bg-secondary text-secondary-foreground shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-secondary/85 hover:shadow-[6px_6px_0_var(--ink)]",
				outline:
					"bg-card text-card-foreground shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent hover:shadow-[6px_6px_0_var(--ink)]",
				ghost:
					"border-transparent bg-transparent text-foreground hover:border-foreground hover:bg-muted",
				destructive:
					"bg-destructive text-destructive-foreground shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[6px_6px_0_var(--ink)]",
				link: "min-h-0 border-transparent bg-transparent px-0 text-foreground underline-offset-4 shadow-none hover:underline",
			},
			size: {
				default: "min-h-12 px-5 py-2.5",
				sm: "min-h-11 px-4 py-2 text-xs",
				lg: "min-h-14 px-7 py-3 text-base",
				icon: "size-12",
				"icon-sm": "size-11",
				"icon-lg": "size-14",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
