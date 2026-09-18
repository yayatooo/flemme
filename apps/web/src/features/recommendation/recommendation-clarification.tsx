import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface RecommendationClarificationProps {
	question: string;
	reason: string;
	onAnswer: (answer: string) => void;
}

export function RecommendationClarification({
	question,
	reason,
	onAnswer,
}: RecommendationClarificationProps) {
	const [answer, setAnswer] = useState("");
	const normalizedAnswer = answer.trim();

	return (
		<Card className="border-transparent bg-lavender shadow-card">
			<CardHeader className="space-y-3">
				<MessageCircleQuestion className="size-8" aria-hidden="true" />
				<h2 className="font-heading text-3xl leading-tight">
					One quick question
				</h2>
				<p className="text-lg font-bold">{question}</p>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{reason}
				</p>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (normalizedAnswer) onAnswer(normalizedAnswer);
					}}
				>
					<label htmlFor="clarification-answer" className="sr-only">
						Your answer
					</label>
					<Textarea
						id="clarification-answer"
						value={answer}
						onChange={(event) => setAnswer(event.currentTarget.value)}
						placeholder="Add the detail Flemme needs"
					/>
					<Button
						type="submit"
						variant="outline"
						className="w-full border-transparent bg-forest text-card! shadow-none hover:bg-forest/90 [&_svg]:text-card!"
						disabled={!normalizedAnswer}
					>
						Update recommendations
						<ArrowRight aria-hidden="true" />
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
