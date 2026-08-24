import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { VehicleShowcaseSection } from "@/components/landing/VehicleShowcaseSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <LandingNav />
      <main>
        <HeroSection />
        <TrustStrip />
        <HowItWorksSection />
        <VehicleShowcaseSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
