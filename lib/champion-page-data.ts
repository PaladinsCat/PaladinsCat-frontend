/** Assembles champion detail data for page rendering.
 * The module preserves canonical data, asset, or metadata behavior used by existing callers.
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
/** Use CHAMPION_PAGE_CLIENT_TIMEOUT_MS to apply the module-specific champion data or asset behavior.
 * Contract: accepts its declared inputs and returns the documented value without changing caller-side state.
 */
export const CHAMPION_PAGE_CLIENT_TIMEOUT_MS = 5_000;

export type ChampionPagePayload = {
  stats: Record<string, unknown> | null;
  talentStats: ChampionTalentStatsResponse | null;
  items: ItemStat[];
  maps: ChampionMapStat[];
  performance: PerformanceMetricsResponse;
  championPerformance: Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>;
};
