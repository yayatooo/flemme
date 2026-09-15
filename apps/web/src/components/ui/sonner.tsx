import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			toastOptions={{
				classNames: {
					toast:
						"!rounded-2xl !border-2 !border-foreground !bg-popover !text-popover-foreground !shadow-hard",
					title: "!font-extrabold",
					description: "!text-muted-foreground",
					actionButton:
						"!rounded-full !border-2 !border-foreground !bg-primary !font-extrabold !text-primary-foreground",
					cancelButton:
						"!rounded-full !border-2 !border-foreground !bg-card !font-extrabold !text-card-foreground",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
