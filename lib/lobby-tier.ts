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
