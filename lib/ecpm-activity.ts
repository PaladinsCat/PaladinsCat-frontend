/**
 * Defines ecpm-activity's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
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
 * Defines the ecpm activity level contract used by this module.
 * Returns: `string`
 * refs: none
 */
export function ecpmActivityLevel(value: number): EcpmActivityLevel {
  if (value >= ECPM_ACTIVITY_THRESHOLDS.engaged) return "engaged";
  if (value >= ECPM_ACTIVITY_THRESHOLDS.disconnected) return "possible-disconnect";
  if (value >= ECPM_ACTIVITY_THRESHOLDS.partialAfk) return "disconnected";
  if (value >= ECPM_ACTIVITY_THRESHOLDS.fullAfk) return "partial-afk";
  return "full-afk";
}

/**
 * Defines the ecpm activity text class contract used by this module.
 * Returns: `string`
 * refs: none
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
 * Returns: `null`
 * Defines the ecpm activity label key contract used by this module.
 * refs: none
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

/** Conservative moderation policy: review 70–119 eCPM, auto-flag only at passive-credit pace or below. · refs: none */
export function isAutomaticAfkFlag(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value < ECPM_ACTIVITY_THRESHOLDS.fullAfk;
}

/**
 * Defines the ecpm activity scale max contract used by this module.
 * Returns: `number`
 * refs: none
 */
export function ecpmActivityScaleMax(values: number[]): number {
  const largest = Math.max(ECPM_ACTIVITY_THRESHOLDS.engaged, ...values.filter(Number.isFinite));
  return Math.max(160, Math.ceil(largest / 20) * 20);
}
