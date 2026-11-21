/** Canonical public site URL (custom domain when you buy one, else Vercel). */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (fromEnv) {
    const withProtocol = fromEnv.startsWith("http")
      ? fromEnv
      : `https://${fromEnv}`;
    return withProtocol.replace(/\/$/, "");
  }

  return "https://swappy.vercel.app";
}

export const SITE_NAME = "Swappy";
export const SITE_TAGLINE = "Creator Market Intelligence";

export const DEFAULT_DESCRIPTION =
  "Swappy is AI-powered creator market intelligence for YouTubers, TikTokers, and social creators. Predict trends, score virality, and know before you publish.";

export const DEFAULT_KEYWORDS = [
  "Swappy",
  "creator market intelligence",
  "content creator AI",
  "virality prediction",
  "YouTube trend analysis",
  "TikTok trend tool",
  "content scoring",
  "publish timing",
  "creator analytics",
];
