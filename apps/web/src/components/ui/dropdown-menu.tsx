import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import type * as React from "react";
import { cn } from "@/lib/utils";

function DropdownMenu({ ...props }: DropdownMenuPrimitive.Root.Props) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
	...props
}: DropdownMenuPrimitive.Trigger.Props) {
	return (
		<DropdownMenuPrimitive.Trigger
			data-slot="dropdown-menu-trigger"
			{...props}
		/>
	);
}

function DropdownMenuContent({
	className,
	align = "end",
	side = "bottom",
	sideOffset = 6,
	...props
}: DropdownMenuPrimitive.Popup.Props &
	Pick<
		DropdownMenuPrimitive.Positioner.Props,
		"align" | "side" | "sideOffset"
	>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Positioner
				align={align}
				side={side}
				sideOffset={sideOffset}
				className="z-50 outline-none"
			>
				<DropdownMenuPrimitive.Popup
					data-slot="dropdown-menu-content"
					className={cn(
						"min-w-48 origin-(--transform-origin) rounded-2xl border-2 border-foreground bg-popover p-1.5 text-popover-foreground shadow-hard outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						className,
					)}
					{...props}
				/>
			</DropdownMenuPrimitive.Positioner>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuItem({
	className,
	...props
}: DropdownMenuPrimitive.Item.Props) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			className={cn(
				"flex min-h-11 cursor-default items-center rounded-xl px-3 py-2 text-sm font-bold outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("-mx-1 my-1 h-0.5 bg-border", className)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
};
