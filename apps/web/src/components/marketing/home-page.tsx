"use client";

import dynamic from "next/dynamic";
import { HomeHero } from "@/components/marketing/home-hero";

const PlaygroundScore = dynamic(
  () =>
    import("@/components/marketing/playground-score").then(
      (m) => m.PlaygroundScore,
    ),
  {
    ssr: false,
    loading: () => <SectionSkeleton label="Loading score demo…" />,
  },
);

const HomeExplore = dynamic(
  () =>
    import("@/components/marketing/home-explore").then((m) => m.HomeExplore),
  {
    ssr: false,
    loading: () => <SectionSkeleton label="Loading playgrounds…" />,
  },
);

const HomeExperience = dynamic(
  () =>
    import("@/components/marketing/home-experience").then(
      (m) => m.HomeExperience,
    ),
  {
    ssr: false,
    loading: () => <SectionSkeleton label="Loading experience lanes…" />,
  },
);

const HomeCta = dynamic(
  () => import("@/components/marketing/home-cta").then((m) => m.HomeCta),
  { ssr: false },
);

const HomeFooter = dynamic(
  () =>
    import("@/components/marketing/home-footer").then((m) => m.HomeFooter),
  { ssr: false },
);

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="border-t border-atelier px-4 py-24 text-center text-sm text-muted-atelier">
      {label}
    </div>
  );
}

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
