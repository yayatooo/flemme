import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface CookingPromptProps {
	request: string;
	onRequestChange: (request: string) => void;
	onSubmit?: (request: string) => void | Promise<void>;
	isSubmitting?: boolean;
	error?: string | null;
}

export function CookingPrompt({
	request,
	onRequestChange,
	onSubmit,
	isSubmitting = false,
	error,
}: CookingPromptProps) {
	const normalizedRequest = request.trim();
	const canSubmit = Boolean(normalizedRequest && onSubmit && !isSubmitting);

	return (
		<Card className="bg-card">
			<CardHeader>
				<h2 className="font-heading text-2xl leading-tight">
					Tell Flemme what you want
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Share a craving, ingredient, or time limit. Your saved kitchen context
					will do the rest.
				</p>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					aria-busy={isSubmitting}
					onSubmit={(event) => {
						event.preventDefault();
						if (!canSubmit || !onSubmit) return;
						void onSubmit(normalizedRequest);
					}}
				>
					<label htmlFor="cooking-request" className="sr-only">
						What do you want to cook?
					</label>
					<Textarea
						id="cooking-request"
						name="request"
						value={request}
						onChange={(event) => onRequestChange(event.currentTarget.value)}
						placeholder="e.g. something quick with eggs"
						aria-invalid={Boolean(error)}
						aria-describedby={error ? "cooking-request-error" : undefined}
					/>
					{error ? (
						<p
							id="cooking-request-error"
							className="text-sm font-bold text-destructive"
							role="alert"
						>
							{error}
						</p>
					) : null}
					<div className="flex justify-end">
						<Button type="submit" disabled={!canSubmit}>
							{isSubmitting ? "Starting…" : "Start cooking"}
							<ArrowRight aria-hidden="true" />
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
