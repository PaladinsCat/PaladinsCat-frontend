/**
 * Define the robots responsibility boundary.
 * Coordinates robots data loading, authorization, and presentation.
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/auth/",
          "/search",
          "/stats/player/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
