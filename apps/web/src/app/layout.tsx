import type { Metadata, Viewport } from "next";
import { Syne, Manrope } from "next/font/google";
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

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#070708",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: "Swappy Studio" }],
  creator: "Swappy Studio",
  publisher: "Swappy Studio",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
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
  alternateName: ["Swappy", "Swappy AI", "Swappy Creator Studio"],
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
    "Virality prediction",
    "Trend tracking",
    "Multimodal content analysis",
    "AI creative agents (coming soon)",
  ],
  keywords: DEFAULT_KEYWORDS.join(", "),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Swappy Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Swappy Studio is an AI creative platform for creators: score and time content with market intelligence today, with AI agents for generation and editing coming next.",
      },
    },
    {
      "@type": "Question",
      name: "What can I use in Swappy today?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can upload drafts, get predictive scores, explore trends, and manage projects in the creator studio workspace.",
      },
    },
    {
      "@type": "Question",
      name: "Are AI creative agents available now?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Agent-powered generation and MCP editing are in development. The live product currently focuses on creator market intelligence and scoring.",
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
    <html lang="en" className={`dark ${syne.variable} ${manrope.variable}`} suppressHydrationWarning>
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
      <body className="min-h-screen bg-canvas font-sans text-pearl antialiased" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
