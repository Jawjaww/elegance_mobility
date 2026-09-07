import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { BerlineExperienceSection } from "@/components/landing/BerlineExperienceSection";
import { VanExperienceSection } from "@/components/landing/VanExperienceSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LANDING_PANEL } from "@/components/landing/landingPanel";

export function LandingPage() {
  return (
    <div
      data-landing-scroll
      className="h-[100svh] overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-y-contain motion-reduce:snap-none bg-neutral-950 text-white"
    >
      <LandingNav />
      <main>
        <section className={LANDING_PANEL} aria-label="Accueil">
          <HeroSection />
          <TrustStrip />
        </section>
        <HowItWorksSection />
        <BerlineExperienceSection />
        <VanExperienceSection />
        <section id="reserver" className={LANDING_PANEL}>
          <FinalCtaSection />
          <LandingFooter />
        </section>
      </main>
    </div>
  );
}
