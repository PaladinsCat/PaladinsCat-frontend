/**
 * Bound client-side champion-page data loading to 5,000 milliseconds.
 * Assembles champion detail data for page rendering.
 * refs: none
 */
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
/**
 * Bound client-side champion-page data loading to 5,000 milliseconds.
 * refs: none
 */
export const CHAMPION_PAGE_CLIENT_TIMEOUT_MS = 5_000;

/**
 * Define champion page payload as `{ stats: Record<string, unknown> | null; talentStats: ChampionTalentStatsResponse | null; items: ItemStat[]; maps: ChampionMapStat[]; performance: PerformanceMetricsResponse; championPerformance: Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>; }`.
 * refs: none
 */
export type ChampionPagePayload = {
  stats: Record<string, unknown> | null;
  talentStats: ChampionTalentStatsResponse | null;
  items: ItemStat[];
  maps: ChampionMapStat[];
  performance: PerformanceMetricsResponse;
  championPerformance: Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>;
};
