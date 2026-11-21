import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  return [
    {
      url: site,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site}/trends`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${site}/auth/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site}/auth/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
