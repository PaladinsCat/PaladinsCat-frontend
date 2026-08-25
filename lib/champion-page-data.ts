import type {
  ChampionMapStat,
  ChampionPerformanceDistribution,
  ChampionTalentStatsResponse,
  ItemStat,
  PerformanceMetricKey,
  PerformanceMetricsResponse,
} from "@/lib/api-client";

export type ChampionPagePayload = {
  stats: Record<string, unknown> | null;
  talentStats: ChampionTalentStatsResponse | null;
  items: ItemStat[];
  maps: ChampionMapStat[];
  performance: PerformanceMetricsResponse;
  championPerformance: Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>;
};
