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

  return "https://www.swappystudio.com";
}

export const SITE_NAME = "Swappy Studio";
export const SITE_TAGLINE = "AI Creative Universe for Modern Creators";

export const DEFAULT_DESCRIPTION =
  "Swappy Studio helps creators turn ideas into extraordinary content — with creator market intelligence today, " +
  "and AI agents for generation and editing on the horizon. Score virality, track trends, and publish with confidence.";

export const DEFAULT_KEYWORDS = [
  "Swappy Studio",
  "Swappy",
  "Swappy AI",
  "AI creative studio",
  "AI content agents",
  "creator market intelligence",
  "creator marketplace intelligence",
  "content marketplace intelligence",
  "AI for content creators",
  "YouTube analytics AI",
  "TikTok analytics tool",
  "virality prediction tool",
  "MCP content editing",
  "AI agent content creation",
  "publish with confidence",
];
