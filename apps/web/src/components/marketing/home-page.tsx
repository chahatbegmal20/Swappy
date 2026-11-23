import { HomeHero } from "@/components/marketing/home-hero";
import { PlaygroundScore } from "@/components/marketing/playground-score";
import { HomeExplore } from "@/components/marketing/home-explore";
import { HomeCapabilities } from "@/components/marketing/home-capabilities";
import { HomeCta } from "@/components/marketing/home-cta";
import { HomeFooter } from "@/components/marketing/home-footer";

export function HomePage() {
  return (
    <div className="bg-canvas text-pearl">
      <HomeHero />
      <PlaygroundScore />
      <HomeExplore />
      <HomeCapabilities />
      <HomeCta />
      <HomeFooter />
    </div>
  );
}
