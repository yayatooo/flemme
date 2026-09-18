import type { ActiveCookingAction } from "@flemme/agent/active-cooking-output";
import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CookingAssistantResult } from "./active-cooking-mutations";

interface CookingAssistantProps {
	disabled: boolean;
	isPending: boolean;
	result: CookingAssistantResult | null;
	errorMessage?: string;
	onAsk: (message: string) => Promise<boolean>;
	onAbandonRequested: (actions: ActiveCookingAction[]) => void;
}

export function CookingAssistant({
	disabled,
	isPending,
	result,
	errorMessage,
	onAsk,
	onAbandonRequested,
}: CookingAssistantProps) {
	const [message, setMessage] = useState("");
	const trimmedMessage = message.trim();

	async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!trimmedMessage || disabled || isPending) return;
		if (await onAsk(trimmedMessage)) setMessage("");
	}

	return (
		<Card className="border-transparent bg-lavender/30 shadow-card">
			<CardHeader className="gap-2">
				<div className="flex items-center gap-2">
					<Sparkles className="size-5 text-primary" aria-hidden="true" />
					<CardTitle>Ask Flemme</CardTitle>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground">
					Ask about what is happening in this step.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{result ? (
					<div className="rounded-2xl bg-secondary/55 p-4">
						<p className="font-bold leading-relaxed">{result.output.reply}</p>
						{result.actionError ? (
							<p
								className="mt-3 text-sm font-bold text-destructive"
								role="alert"
							>
								{result.actionError}
							</p>
						) : null}
						{result.requiresAbandonConfirmation ? (
							<Button
								type="button"
								variant="destructive"
								className="mt-4"
								onClick={() => onAbandonRequested(result.output.actions)}
							>
								Review abandon action
							</Button>
						) : null}
					</div>
				) : null}
				<form className="space-y-3" onSubmit={submitQuestion}>
					<label className="sr-only" htmlFor="cooking-question">
						Message Flemme
					</label>
					<Textarea
						id="cooking-question"
						value={message}
						onChange={(event) => setMessage(event.target.value)}
						placeholder="Is this cooked enough?"
						maxLength={2000}
						className="min-h-20"
						disabled={disabled}
					/>
					<div className="flex items-center justify-between gap-3">
						{errorMessage ? (
							<p className="text-sm font-bold text-destructive" role="alert">
								{errorMessage}
							</p>
						) : (
							<span />
						)}
						<Button
							type="submit"
							disabled={disabled || isPending || !trimmedMessage}
						>
							{isPending ? "Asking..." : "Ask"}
							<Send aria-hidden="true" />
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
