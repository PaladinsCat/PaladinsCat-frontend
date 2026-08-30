import type {
  ChampionMapStat,
  ChampionPerformanceDistribution,
  ChampionTalentStatsResponse,
  ItemStat,
  PerformanceMetricKey,
  PerformanceMetricsResponse,
} from "@/lib/api-client";

// Tier-scoped bundles can require a bounded cold query before Redis is warm.
// Keep this above the observed production p95 while still failing promptly.
export const CHAMPION_PAGE_CLIENT_TIMEOUT_MS = 5_000;

export type ChampionPagePayload = {
  stats: Record<string, unknown> | null;
  talentStats: ChampionTalentStatsResponse | null;
  items: ItemStat[];
  maps: ChampionMapStat[];
  performance: PerformanceMetricsResponse;
  championPerformance: Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>;
};
