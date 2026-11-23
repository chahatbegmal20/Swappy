import { HomeHero } from "@/components/marketing/home-hero";
import { PlaygroundScore } from "@/components/marketing/playground-score";
import { HomeExplore } from "@/components/marketing/home-explore";
import { HomeExperience } from "@/components/marketing/home-experience";
import { HomeCta } from "@/components/marketing/home-cta";
import { HomeFooter } from "@/components/marketing/home-footer";

export function HomePage() {
  return (
    <div className="bg-canvas text-pearl">
      <HomeHero />
      <PlaygroundScore />
      <HomeExplore />
      <HomeExperience />
      <HomeCta />
      <HomeFooter />
    </div>
  );
}
