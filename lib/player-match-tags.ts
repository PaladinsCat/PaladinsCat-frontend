/** Canonical per-match earning keys; these are evidence, not profile totals. */
export const PERFORMANCE_MATCH_TAGS = [
  "wall_shooter", "master_feeding", "tank_diff", "support_diff", "dps_diff",
  "flank_diff", "noob", "hypercarry", "automatic_afk",
] as const;
export type PerformanceMatchTag = typeof PERFORMANCE_MATCH_TAGS[number];

export function normalizeMatchPerformanceTags(value: unknown): PerformanceMatchTag[] {
  return Array.isArray(value) ? [...new Set(value.filter((tag): tag is PerformanceMatchTag =>
    PERFORMANCE_MATCH_TAGS.includes(tag),
  ))] : [];
}
