export type LobbyTierFilter = "all" | "bronze-gold" | "platinum-plus" | "diamond-plus";

export type LobbyTierDefinition = {
  value: LobbyTierFilter;
  label: string;
  description: string;
  tierMin?: number;
  tierMax?: number;
};

export const LOBBY_TIER_FILTERS: Record<LobbyTierFilter, LobbyTierDefinition> = {
  all: { value: "all", label: "All ranked lobbies", description: "Include every ranked lobby tier." },
  "bronze-gold": { value: "bronze-gold", label: "Bronze 5 – Gold 1", description: "Use Bronze through Gold ranked lobbies.", tierMin: 1, tierMax: 15 },
  "platinum-plus": { value: "platinum-plus", label: "Platinum 5+", description: "Use Platinum, Diamond, Master, and Grandmaster lobbies.", tierMin: 16, tierMax: 26 },
  "diamond-plus": { value: "diamond-plus", label: "Diamond 5+", description: "Use Diamond, Master, and Grandmaster lobbies.", tierMin: 21, tierMax: 26 },
};

export const LOBBY_TIER_OPTIONS = Object.values(LOBBY_TIER_FILTERS);
export const LOBBY_TIER_STORAGE_KEY = "pc_lobby_tier_filter";

export function isLobbyTierFilter(value: unknown): value is LobbyTierFilter {
  return typeof value === "string" && value in LOBBY_TIER_FILTERS;
}

export function getStoredLobbyTierFilter(): LobbyTierFilter {
  if (typeof window === "undefined") return "all";
  const stored = window.localStorage.getItem(LOBBY_TIER_STORAGE_KEY);
  return isLobbyTierFilter(stored) ? stored : "all";
}

const GLOBAL_STAT_PATHS = [
  "/stats/",
  "/champions/overview",
  "/champions/top-winrate",
  "/champions/",
  "/matches/compositions",
];

const UNSCOPED_STAT_PATHS = [
  "/stats/tiers",
  "/stats/leagues",
  "/stats/tier-population",
  "/stats/ranked-leaderboard",
  "/stats/leaderboard-log",
  "/stats/champion-leaderboard",
  "/stats/player/",
  "/champions/tiers",
];

export function withStoredLobbyTier(path: string): string {
  if (typeof window === "undefined") return path;
  const pathname = path.split("?", 1)[0];
  if (!GLOBAL_STAT_PATHS.some((prefix) => pathname.startsWith(prefix))) return path;
  if (UNSCOPED_STAT_PATHS.some((prefix) => pathname.startsWith(prefix))) return path;

  const definition = LOBBY_TIER_FILTERS[getStoredLobbyTierFilter()];
  if (definition.tierMin == null && definition.tierMax == null) return path;
  const existing = new URLSearchParams(path.includes("?") ? path.slice(path.indexOf("?") + 1) : "");
  if (existing.has("tierMin") || existing.has("tierMax")) return path;
  const separator = path.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  if (definition.tierMin != null) params.set("tierMin", String(definition.tierMin));
  if (definition.tierMax != null) params.set("tierMax", String(definition.tierMax));
  return `${path}${separator}${params.toString()}`;
}
