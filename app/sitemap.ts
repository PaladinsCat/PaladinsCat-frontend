import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";

const PLAYER_ROLES = ["frontline", "damage", "flank", "support"] as const;
const PLAYER_METRICS = ["dpm", "hpm", "gpm", "mpm"] as const;
// These URLs remain useful after a map leaves rotation because their historic
// ranked data remains available. Keep this curated list small and canonical.
const RANKED_MAPS = [
  "Ranked Ascension Peak",
  "Ranked Bazaar",
  "Ranked Brightmarsh",
  "Ranked Frog Isle",
  "Ranked Ice Mines",
  "Ranked Jaguar Falls",
  "Ranked Serpent Beach",
  "Ranked Splitstone Quarry",
  "Ranked Stone Keep (Classic)",
  "Ranked Stone Keep V2 Night",
  "Ranked Warder's Gate",
] as const;

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
  { path: "/players/cheaters", changeFrequency: "daily", priority: 0.65 },
  { path: "/players/suspicious", changeFrequency: "daily", priority: 0.65 },
  { path: "/players/weirdos", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/hall-of-fame", changeFrequency: "daily", priority: 0.6 },
  { path: "/stats/winrate", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/banrate", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/metrics", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/tiers", changeFrequency: "hourly", priority: 0.8 },
  { path: "/stats/items", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/talents", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/loadouts", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/regions", changeFrequency: "daily", priority: 0.7 },
  { path: "/stats/platforms", changeFrequency: "daily", priority: 0.7 },
  { path: "/stats/maps", changeFrequency: "daily", priority: 0.7 },
  { path: "/builds", changeFrequency: "daily", priority: 0.6 },
  { path: "/community", changeFrequency: "daily", priority: 0.6 },
  { path: "/changelog", changeFrequency: "monthly", priority: 0.35 },
  { path: "/about", changeFrequency: "monthly", priority: 0.45 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const championEntries = STATIC_CHAMPIONS.map((champion) => ({
    url: `${SITE_URL}/champions/${championSlug(champion.name)}`,
    changeFrequency: "daily" as const,
    priority: 0.78,
  }));

  const roleEntries = PLAYER_ROLES.map((role) => ({
    url: `${SITE_URL}/players/class/${role}`,
    changeFrequency: "daily" as const,
    priority: 0.72,
  }));

  const metricEntries = PLAYER_METRICS.map((metric) => ({
    url: `${SITE_URL}/players/stats/${metric}`,
    changeFrequency: "daily" as const,
    priority: 0.72,
  }));

  const mapEntries = RANKED_MAPS.map((mapName) => ({
    url: `${SITE_URL}/stats/maps/${encodeURIComponent(mapName)}`,
    changeFrequency: "weekly" as const,
    priority: 0.68,
  }));

  return [...staticEntries, ...championEntries, ...roleEntries, ...metricEntries, ...mapEntries];
}
