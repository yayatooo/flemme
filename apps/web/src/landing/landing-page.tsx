import {
	AboutSection,
	BrandTicker,
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
		<main className="overflow-x-hidden bg-background">
			<LandingNavbar />
			<LandingBanner />
			<BrandTicker />
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
