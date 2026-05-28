import { BackgroundGrid } from "@/components/landing/background-grid";
import { Navbar } from "@/components/landing/navbar";
import { SocialRail } from "@/components/landing/social-rail";
import { Hero } from "@/components/landing/hero";
import { MarqueeRibbon } from "@/components/landing/marquee-ribbon";
import { Exploration } from "@/components/landing/exploration";
import { Process } from "@/components/landing/process";
import { Methodology } from "@/components/landing/methodology";
import { Recognition } from "@/components/landing/recognition";
import { Journal } from "@/components/landing/journal";
import { Footer } from "@/components/landing/footer";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { SpotlightCursor } from "@/components/effects/spotlight-cursor";
import { PageReveal } from "@/components/effects/page-reveal";

/**
 * LinkUp landing page composition. Loaded effects:
 *  - PageReveal       (one-shot curtain on first paint)
 *  - SpotlightCursor  (blurple light following the pointer, mix-blend-screen)
 *  - ScrollProgress   (top hairline that fills as the user scrolls)
 *  - SocialRail       (right-edge vertical social column with "تابعنا" wordmark)
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg relative">
      <PageReveal />
      <ScrollProgress />
      <SpotlightCursor />
      <BackgroundGrid />
      <SocialRail />
      <main className="relative z-10">
        <Navbar />
        <Hero />
        <MarqueeRibbon />
        <Exploration />
        <Process />
        <Methodology />
        <Recognition />
        <Journal />
        <Footer />
      </main>
    </div>
  );
}
