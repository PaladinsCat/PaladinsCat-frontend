import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { SITE_URL } from "@/lib/seo";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { championSlug } from "@/lib/utils";
import { getAllPosts, getPostLink } from "@/lib/blog";

const PLAYER_ROLES = ["frontline", "damage", "flank", "support"] as const;
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
  { path: "/champions", changeFrequency: "hourly", priority: 0.95 },
  { path: "/stats", changeFrequency: "hourly", priority: 0.95 },
  { path: "/players", changeFrequency: "hourly", priority: 0.9 },
  { path: "/matches", changeFrequency: "hourly", priority: 0.85 },
  { path: "/game/items", changeFrequency: "daily", priority: 0.9 },
  { path: "/game/maps", changeFrequency: "daily", priority: 0.9 },
  { path: "/game/compositions", changeFrequency: "hourly", priority: 0.9 },
  { path: "/players/leaderboard", changeFrequency: "hourly", priority: 0.85 },
  { path: "/players/elo", changeFrequency: "hourly", priority: 0.85 },
  { path: "/players/performance", changeFrequency: "hourly", priority: 0.85 },
  { path: "/players/cheaters", changeFrequency: "daily", priority: 0.65 },
  { path: "/players/boosted", changeFrequency: "daily", priority: 0.65 },
  { path: "/players/suspicious", changeFrequency: "daily", priority: 0.65 },
  { path: "/players/weirdos", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/hall-of-fame", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/private-accounts", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/parties", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/droppers", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/afk-wintrade", changeFrequency: "daily", priority: 0.6 },
  { path: "/players/alt-accounts", changeFrequency: "daily", priority: 0.6 },
  { path: "/stats/winrate", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/banrate", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/skins", changeFrequency: "daily", priority: 0.8 },
  { path: "/stats/performance", changeFrequency: "hourly", priority: 0.9 },
  { path: "/stats/ecpm", changeFrequency: "hourly", priority: 0.85 },
  { path: "/stats/activity", changeFrequency: "hourly", priority: 0.8 },
  { path: "/stats/activity/details", changeFrequency: "hourly", priority: 0.7 },
  { path: "/stats/tiers", changeFrequency: "hourly", priority: 0.8 },
  { path: "/stats/talents", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/loadouts", changeFrequency: "daily", priority: 0.75 },
  { path: "/stats/regions", changeFrequency: "daily", priority: 0.7 },
  { path: "/stats/platforms", changeFrequency: "daily", priority: 0.7 },
  { path: "/builds", changeFrequency: "daily", priority: 0.8 },
  { path: "/community", changeFrequency: "daily", priority: 0.8 },
  { path: "/community/diminishing-returns", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tierlists", changeFrequency: "daily", priority: 0.8 },
  { path: "/blog", changeFrequency: "daily", priority: 0.8 },
  { path: "/changelog", changeFrequency: "daily", priority: 0.8 },
  { path: "/operations/stats", changeFrequency: "hourly", priority: 0.8 },
  { path: "/operations/paladinscat-bot", changeFrequency: "monthly", priority: 0.75 },
  { path: "/localization", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.45 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.2 },
];

const getCachedBlogPosts = unstable_cache(getAllPosts, ["sitemap-blog-posts"], {
  revalidate: 3600,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const mapEntries = RANKED_MAPS.map((mapName) => ({
    url: `${SITE_URL}/game/maps/${encodeURIComponent(mapName)}`,
    changeFrequency: "weekly" as const,
    priority: 0.68,
  }));

  const blogEntries = (await getCachedBlogPosts()).map((post) => ({
    url: `${SITE_URL}${getPostLink(post.slug)}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...championEntries, ...roleEntries, ...mapEntries, ...blogEntries];
}
