import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/stats", changeFrequency: "hourly", priority: 0.95 },
  { path: "/champions", changeFrequency: "hourly", priority: 0.95 },
  { path: "/players", changeFrequency: "hourly", priority: 0.9 },
  { path: "/matches", changeFrequency: "hourly", priority: 0.85 },
  { path: "/players/leaderboard", changeFrequency: "hourly", priority: 0.85 },
  { path: "/players/elo", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/winrate", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/banrate", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/metrics", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/tiers", changeFrequency: "hourly", priority: 0.8 },
  { path: "/stats/items", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/talents", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/loadouts", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/regions", changeFrequency: "daily", priority: 0.7 },
  { path: "/stats/platforms", changeFrequency: "daily", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.45 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const championEntries = STATIC_CHAMPIONS.map((champion) => ({
    url: `${SITE_URL}/champions/${championSlug(champion.name)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.78,
  }));

  return [...staticEntries, ...championEntries];
}
