import { z } from "zod";

export const CompletionOutputSchema = z.object({
	reply: z.string().trim().min(1),
	summary: z.object({
		title: z.string().trim().min(1),
		description: z.string().trim().min(1),
	}),
	notes: z.array(z.string().trim().min(1)),
});

export type CompletionOutput = z.infer<typeof CompletionOutputSchema>;
