import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${SITE_NAME} — AI Creative Studio & Creator Intelligence`,
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Swappy Studio",
    "AI creative studio",
    "creator market intelligence",
    "AI content agents",
    "virality prediction",
    "YouTube TikTok analytics AI",
  ],
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}
