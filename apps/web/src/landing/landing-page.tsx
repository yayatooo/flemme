import {
	AboutSection,
	DiscoverSection,
	FinalCtaSection,
	HowItWorksSection,
	LandingBanner,
	LandingFooter,
	LandingNavbar,
	PersonalizationSection,
	PricingSection,
} from "@/components/landing";

export function LandingPage() {
	return (
		<main
			data-theme="platform"
			className="overflow-x-clip bg-background text-foreground"
		>
			<LandingNavbar />
			<LandingBanner />
			<DiscoverSection />
			<AboutSection />
			<HowItWorksSection />
			<PersonalizationSection />
			<PricingSection />
			<FinalCtaSection />
			<LandingFooter />
		</main>
	);
}
