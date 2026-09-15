import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kickerClass } from "./styles";

export function FinalCtaSection() {
	return (
		<section className="relative grid justify-items-center overflow-hidden bg-foreground px-5 py-24 text-center text-background">
			<span className="absolute top-[10%] right-[8%] rotate-14 text-5xl text-secondary">
				✦
			</span>
			<p className={`${kickerClass} text-mustard!`}>Dinner is waiting</p>
			<h2 className="mt-3 font-heading text-[clamp(3.1rem,14vw,7rem)] leading-[0.9] font-normal tracking-[-0.045em]">
				Still wondering
				<br />
				what to cook?
			</h2>
			<p className="my-3 mb-8 -rotate-3 font-['Shrikhand'] text-[clamp(2rem,9vw,4.5rem)] text-primary">
				Open your fridge.
			</p>
			<Button
				className="bg-primary shadow-[5px_5px_0_var(--orange)]"
				size="lg"
				render={<Link to="/register" />}
			>
				Let Flemme cook with you <ArrowRight />
			</Button>
		</section>
	);
}
