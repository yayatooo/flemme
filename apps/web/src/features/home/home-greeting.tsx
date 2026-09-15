interface HomeGreetingProps {
	displayName: string;
}

export function HomeGreeting({ displayName }: HomeGreetingProps) {
	return (
		<header className="space-y-2">
			<p className="text-sm font-extrabold text-muted-foreground">
				Hello, {displayName}!
			</p>
			<h1 className="max-w-sm font-heading text-4xl leading-[0.95] tracking-tight sm:text-5xl">
				Mau masak apa hari ini?
			</h1>
		</header>
	);
}
