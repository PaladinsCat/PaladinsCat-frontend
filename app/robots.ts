/**
 * Return crawler rules allowing public pages while excluding admin, authentication, search, and player-stat routes, together with the site sitemap URL.
 * refs: none
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Return crawler rules allowing public pages while excluding admin, authentication, search, and player-stat routes, together with the site sitemap URL.
 * refs: none
 * I/O types: `none -> MetadataRoute.Robots`.
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
