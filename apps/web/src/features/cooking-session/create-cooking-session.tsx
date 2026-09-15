import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateCookingSessionActionProps {
	isPending: boolean;
	isCreated: boolean;
	disabled: boolean;
	errorMessage?: string | null;
	onStart: () => void;
}

export function CreateCookingSessionAction({
	isPending,
	isCreated,
	disabled,
	errorMessage,
	onStart,
}: CreateCookingSessionActionProps) {
	return (
		<>
			<Button
				type="button"
				size="lg"
				className="w-full"
				disabled={disabled || isPending || isCreated}
				onClick={onStart}
			>
				{isPending ? (
					<>
						Starting cooking…
						<LoaderCircle className="animate-spin" aria-hidden="true" />
					</>
				) : isCreated ? (
					"Session created"
				) : (
					<>
						{errorMessage ? "Try again" : "Start cooking"}
						<ArrowRight aria-hidden="true" />
					</>
				)}
			</Button>
			{errorMessage ? (
				<p
					className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive"
					role="alert"
				>
					{errorMessage}
				</p>
			) : null}
		</>
	);
}
