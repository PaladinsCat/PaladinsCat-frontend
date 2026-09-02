/**
 * Defines lobby-tier's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 */
import type { TranslationKey } from "@/lib/localization/messages";

/**
 * Defines the  lobby tier filter contract used by this module.
 */
export type LobbyTierFilter = "all" | "bronze-gold" | "platinum-plus" | "diamond-plus";

/**
 * Defines the  lobby tier definition contract used by this module.
 */
export type LobbyTierDefinition = {
  value: LobbyTierFilter;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  tierMin?: number;
  tierMax?: number;
};

/**
 * Defines the  l o b b y_ t i e r_ f i l t e r s contract used by this module.
 * Returns: `Record<LobbyTierFilter, LobbyTierDefinition>`
 */
export const LOBBY_TIER_FILTERS: Record<LobbyTierFilter, LobbyTierDefinition> = {
  all: {
    value: "all",
    labelKey: "account.lobbyTier.all.label",
    descriptionKey: "account.lobbyTier.all.description",
  },
  "bronze-gold": {
    value: "bronze-gold",
    labelKey: "account.lobbyTier.bronzeGold.label",
    descriptionKey: "account.lobbyTier.bronzeGold.description",
    tierMin: 1,
    tierMax: 15,
  },
  "platinum-plus": {
    value: "platinum-plus",
    labelKey: "account.lobbyTier.platinumPlus.label",
    descriptionKey: "account.lobbyTier.platinumPlus.description",
    tierMin: 16,
    tierMax: 26,
  },
  "diamond-plus": {
    value: "diamond-plus",
    labelKey: "account.lobbyTier.diamondPlus.label",
    descriptionKey: "account.lobbyTier.diamondPlus.description",
    tierMin: 21,
    tierMax: 26,
  },
};

/**
 * Defines the  l o b b y_ t i e r_ o p t i o n s contract used by this module.
 */
export const LOBBY_TIER_OPTIONS = Object.values(LOBBY_TIER_FILTERS);
/**
 * Defines the  l o b b y_ t i e r_ s t o r a g e_ k e y contract used by this module.
 */
export const LOBBY_TIER_STORAGE_KEY = "pc_lobby_tier_filter";

/**
 * Transforms or validates is lobby tier filter according to this module's data contract.
 */
export function isLobbyTierFilter(value: unknown): value is LobbyTierFilter {
  return typeof value === "string" && value in LOBBY_TIER_FILTERS;
}

/**
 * Reads stored lobby tier filter from the module's configured source.
 */
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

/**
 * Defines the with stored lobby tier contract used by this module.
 * Returns: `string`
 */
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
