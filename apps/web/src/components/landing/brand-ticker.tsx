import { tickerStatements } from "./data";

export function BrandTicker() {
	const tickerItems = tickerStatements.slice(0, tickerStatements.length / 2);

	return (
		<section
			className="overflow-hidden border-y border-border bg-primary"
			aria-label="Flemme values"
		>
			<div className="flex w-max animate-marquee motion-reduce:animate-none">
				{[false, true].map((isDuplicate) => (
					<div
						className="flex w-max min-w-screen shrink-0 justify-around"
						key={isDuplicate ? "duplicate" : "primary"}
						aria-hidden={isDuplicate || undefined}
					>
						{tickerItems.map(({ id, text }) => (
							<span
								className="py-3.5 pl-6 text-xs font-extrabold tracking-widest whitespace-nowrap text-primary-foreground uppercase"
								key={id}
							>
								{text} <b className="ml-6 text-foreground">✦</b>
							</span>
						))}
					</div>
				))}
			</div>
		</section>
	);
}
