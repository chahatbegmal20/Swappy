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
export const SITE_TAGLINE = "Creator Market Intelligence Platform";

export const DEFAULT_DESCRIPTION =
  "Swappy is a free creator market intelligence platform for YouTube, TikTok, Instagram, and social media creators. " +
  "Get AI content scoring, virality prediction, trend tracking, audience fit analysis, and the best time to publish — before you post.";

export const DEFAULT_KEYWORDS = [
  "Swappy",
  "Swappy AI",
  "Swappy creator",
  "Swappy content",
  "creator market intelligence",
  "creator marketplace intelligence",
  "content marketplace intelligence",
  "content market intelligence",
  "AI for content creators",
  "YouTube analytics AI",
  "TikTok analytics tool",
  "Instagram content strategy",
  "virality prediction tool",
  "predict video virality",
  "content virality score",
  "trend intelligence for creators",
  "YouTube trend tracker",
  "TikTok trend finder",
  "best time to post on YouTube",
  "best time to post on TikTok",
  "audience fit analysis",
  "content scoring AI",
  "publish with confidence",
  "creator economy tools",
  "social media intelligence platform",
  "pre-publish content analysis",
  "AI thumbnail and video analysis",
];
