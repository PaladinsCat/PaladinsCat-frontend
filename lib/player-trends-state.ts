/** Combine trend sums/counts without averaging bucket averages.
 * Pure state helpers keep missing metrics distinct from measured zero.
 * refs: migrations: 169 · see: lib/player-trends-api.ts
 */
import type { PlayerTrendTotals, PlayerTrendMetric, PlayerTrendBucket } from "./player-trends-api";

/**
 * Compute a mean from additive state, preserving unavailable metrics.
 * I/O: PlayerTrendTotals|undefined, PlayerTrendMetric -> number|null; pure.
 * refs: migrations: 169
 * I/O types: `total: PlayerTrendTotals | undefined; metric: PlayerTrendMetric -> number | null`.
 */
export function trendMean(total: PlayerTrendTotals | undefined, metric: PlayerTrendMetric): number | null {
  const count = total?.samples[metric] ?? 0;
  return count > 0 ? (total?.sums[metric] ?? 0) / count : null;
}

/**
 * Subtract exact window contributions to recover the historical opening baseline.
 * I/O: PlayerTrendTotals, PlayerTrendBucket[] -> PlayerTrendTotals; pure arithmetic.
 * Related helper: `trendMean` in this module.
 * refs: migrations: 169
 * I/O types: `total: PlayerTrendTotals; buckets: PlayerTrendBucket[] -> PlayerTrendTotals`.
 */
export function openingTrendTotals(total: PlayerTrendTotals, buckets: PlayerTrendBucket[]): PlayerTrendTotals {
  const result = { ...total, sums: { ...total.sums }, samples: { ...total.samples } };
  for (const bucket of buckets.filter(item=>item.championId === total.championId)) {
    result.matches -= bucket.matches; result.wins -= bucket.wins;
    for (const key of Object.keys(bucket.samples) as PlayerTrendMetric[]) {
      result.sums[key] = (result.sums[key] ?? 0) - (bucket.sums[key] ?? 0);
      result.samples[key] = Math.max(0, (result.samples[key] ?? 0) - (bucket.samples[key] ?? 0));
    }
  }
  return result;
}
