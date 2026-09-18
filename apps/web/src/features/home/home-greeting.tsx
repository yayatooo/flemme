interface HomeGreetingProps {
	displayName: string;
}

export function HomeGreeting({ displayName }: HomeGreetingProps) {
	return (
		<header className="space-y-1.5 py-1">
			<p className="text-[0.6875rem] font-extrabold tracking-[0.16em] text-primary uppercase">
				Hello, {displayName}!
			</p>
			<h1 className="max-w-md font-heading text-[2rem] leading-[1.05] tracking-tight sm:text-4xl">
				Mau masak apa hari ini?
			</h1>
		</header>
	);
}
