/** Share URL metric selectors while keeping ranked and casual populations separate.
 * refs: endpoints: GET /stats/performance-metrics · migrations: 169
 */
/**
 * Name supported populations. I/O: type only; refs: endpoints: GET /stats/performance-metrics
 */
export type PerformanceScope = "ranked" | "casual";
/**
 * Name selectable metrics, preserving damage DPM and explicit deaths/min.
 * I/O: type only; refs: migrations: 169
 */
export type GamePerformanceMetric = "dpm" | "hpm" | "gpm" | "mpm" | "kda" | "kpm" | "deaths_per_minute";
/**
 * List stable metric query keys. I/O: readonly string tuple; refs: endpoints: GET /stats/performance-metrics
 */
export const GAME_PERFORMANCE_METRICS = ["dpm", "hpm", "gpm", "mpm", "kda", "kpm", "deaths_per_minute"] as const;

/**
 * Normalize URL selectors to a supported scope/metric pair without side effects.
 * I/O: string|null|undefined, string|null|undefined -> {scope:PerformanceScope,metric:GamePerformanceMetric}.
 * refs: endpoints: GET /stats/performance-metrics
 * I/O types: `scope?: string | null; metric?: string | null -> { scope: PerformanceScope; metric: GamePerformanceMetric; }`.
 */
export function performanceSelection(scope?: string | null, metric?: string | null) {
  const selectedScope: PerformanceScope = scope === "casual" ? "casual" : "ranked";
  const selectedMetric: GamePerformanceMetric = GAME_PERFORMANCE_METRICS.includes(metric as GamePerformanceMetric)
    && !(selectedScope === "casual" && metric === "kda") ? metric as GamePerformanceMetric : "dpm";
  return { scope: selectedScope, metric: selectedMetric };
}
