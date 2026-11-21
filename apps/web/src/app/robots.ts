import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/callback", "/dashboard", "/settings", "/upload", "/project/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
