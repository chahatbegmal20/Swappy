import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Navbar } from "@/components/navbar";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — Creator Market Intelligence & Virality Prediction`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: "Swappy" }],
  creator: "Swappy",
  publisher: "Swappy",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Creator Market Intelligence Platform`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Creator Market Intelligence Platform`,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  alternateName: [
    "Swappy AI",
    "Swappy Creator Market Intelligence",
    "Creator Marketplace Intelligence",
  ],
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Creator Analytics",
  operatingSystem: "Web",
  url: siteUrl,
  description: DEFAULT_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Creator market intelligence",
    "YouTube and TikTok trend tracking",
    "Virality prediction",
    "Audience fit scoring",
    "Launch timing recommendations",
    "Multimodal content analysis",
  ],
  keywords: DEFAULT_KEYWORDS.join(", "),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Swappy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Swappy is a creator market intelligence platform that helps content creators predict trends, score virality, and decide when to publish on YouTube, TikTok, Instagram, and other social platforms.",
      },
    },
    {
      "@type": "Question",
      name: "What is creator market intelligence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Creator market intelligence combines trend data, audience signals, and AI scoring so creators can understand demand and competition before posting content.",
      },
    },
    {
      "@type": "Question",
      name: "Can Swappy help me predict if a video will go viral?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Swappy provides predictive scores for virality, trend alignment, audience fit, and launch timing so you can improve drafts before they go live.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} bg-gray-950 text-white min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
