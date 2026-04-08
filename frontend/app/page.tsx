import { getCurrentRound, getBeanSupply } from "@/lib/minebean";
import { HeroSection } from "@/components/hero-section";
import { StatsBar } from "@/components/stats-bar";
import { PricingCards } from "@/components/pricing-cards";

export const revalidate = 30;

export default async function Home() {
  let currentRound = 0;
  let beanSupply = "0";

  try {
    [currentRound, beanSupply] = await Promise.all([
      getCurrentRound(),
      getBeanSupply(),
    ]);
  } catch {
    // Chain fetch failed — show zeros
  }

  return (
    <main className="flex flex-col min-h-screen">
      <HeroSection />
      <StatsBar currentRound={currentRound} beanSupply={beanSupply} />
      <PricingCards />
    </main>
  );
}
