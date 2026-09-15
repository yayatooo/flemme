import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"group/badge inline-flex min-h-7 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border-2 border-foreground px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/70 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:pointer-events-none [&>svg]:size-3!",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
				secondary:
					"bg-secondary text-secondary-foreground [a]:hover:bg-secondary/85",
				destructive:
					"bg-destructive text-destructive-foreground [a]:hover:bg-destructive/90",
				outline: "bg-card text-foreground [a]:hover:bg-muted",
				ghost:
					"border-transparent bg-transparent text-foreground hover:border-foreground hover:bg-muted",
				link: "min-h-0 border-transparent bg-transparent px-0 text-foreground underline-offset-4 hover:underline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant = "default",
	render,
	...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(badgeVariants({ variant }), className),
			},
			props,
		),
		render,
		state: {
			slot: "badge",
			variant,
		},
	});
}

export { Badge, badgeVariants };
