/**
 * Defines ecpm-activity's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 * refs: none
 */
/**
 * Publish the ecpm activity thresholds configuration as `{ fullAfk: 70, partialAfk: 90, disconnected: 110, engaged: 120, } as const`.
 * refs: none
 */
export const ECPM_ACTIVITY_THRESHOLDS = {
  fullAfk: 70,
  partialAfk: 90,
  disconnected: 110,
  engaged: 120,
} as const;

/**
 * Defines the  ecpm activity level contract used by this module.
 * refs: none
 */
export type EcpmActivityLevel = "engaged" | "possible-disconnect" | "disconnected" | "partial-afk" | "full-afk";
/**
 * Defines the  ecpm activity label key contract used by this module.
 * refs: none
 */
export type EcpmActivityLabelKey =
  | "generated.stats.egpm.engaged"
  | "common.activity.possibleDisconnect"
  | "generated.stats.egpm.disconnected"
  | "generated.stats.egpm.partialAfk"
  | "generated.stats.egpm.fullAfk";

/**
 * Classify the economy-per-minute value against descending engaged, disconnected, partial-AFK, and full-AFK thresholds; values below every threshold are full-AFK.
 * refs: none
 * I/O types: `value: number -> EcpmActivityLevel`.
 */
export function ecpmActivityLevel(value: number): EcpmActivityLevel {
  if (value >= ECPM_ACTIVITY_THRESHOLDS.engaged) return "engaged";
  if (value >= ECPM_ACTIVITY_THRESHOLDS.disconnected) return "possible-disconnect";
  if (value >= ECPM_ACTIVITY_THRESHOLDS.partialAfk) return "disconnected";
  if (value >= ECPM_ACTIVITY_THRESHOLDS.fullAfk) return "partial-afk";
  return "full-afk";
}

/**
 * Map finite economy-per-minute activity to emerald, yellow, orange, or red text classes; use muted text for missing or non-finite values.
 * refs: none
 * I/O types: `value: number | null | undefined -> string`.
 */
export function ecpmActivityTextClass(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "text-pc-text-muted";
  switch (ecpmActivityLevel(value)) {
    case "engaged": return "text-emerald-400";
    case "possible-disconnect": return "text-yellow-300";
    case "disconnected": return "text-yellow-400";
    case "partial-afk": return "text-orange-400";
    case "full-afk": return "text-red-400";
  }
}

/**
 * Return the localization key for a finite economy-per-minute activity classification; return null for missing or non-finite values.
 * refs: none
 * I/O types: `value: number | null | undefined -> EcpmActivityLabelKey | null`.
 */
export function ecpmActivityLabelKey(value: number | null | undefined): EcpmActivityLabelKey | null {
  if (value == null || !Number.isFinite(value)) return null;
  switch (ecpmActivityLevel(value)) {
    case "engaged": return "generated.stats.egpm.engaged";
    case "possible-disconnect": return "common.activity.possibleDisconnect";
    case "disconnected": return "generated.stats.egpm.disconnected";
    case "partial-afk": return "generated.stats.egpm.partialAfk";
    case "full-afk": return "generated.stats.egpm.fullAfk";
  }
}

/**
 * Conservative moderation policy: review 70–119 eCPM, auto-flag only at passive-credit pace or below. · refs: none
 * I/O types: `value: number | null | undefined -> boolean`.
 */
export function isAutomaticAfkFlag(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value < ECPM_ACTIVITY_THRESHOLDS.fullAfk;
}

/**
 * Choose an activity-chart maximum of at least 160, rounding the largest finite value or engaged threshold up to a multiple of 20.
 * refs: none
 * I/O types: `values: number[] -> number`.
 */
export function ecpmActivityScaleMax(values: number[]): number {
  const largest = Math.max(ECPM_ACTIVITY_THRESHOLDS.engaged, ...values.filter(Number.isFinite));
  return Math.max(160, Math.ceil(largest / 20) * 20);
}
