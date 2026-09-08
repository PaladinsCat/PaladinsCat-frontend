/**
 * Defines time-zone's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 * refs: none
 */
"use client";

/**
 * Defines the  t i m e_ z o n e_ s t o r a g e_ k e y contract used by this module.
 * refs: none
 */
export const TIME_ZONE_STORAGE_KEY = "pc_time_zone";
const FALLBACK_TIME_ZONE = "UTC";
const FIXED_UTC_OFFSET_MINUTES = [
  -720, -660, -600, -570, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60,
  0,
  60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 525, 540, 570,
  600, 630, 660, 690, 720, 765, 780, 840,
];

/**
 * Accept a nonempty time-zone name of at most 64 characters only when Intl.DateTimeFormat accepts it; return false on validation errors.
 * refs: none
 * I/O types: `value: string | null | undefined -> value is string`.
 */
export function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function browserTimeZone(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(detected) ? detected : FALLBACK_TIME_ZONE;
}

/**
 * Return the SSR fallback zone, otherwise use a valid localStorage preference or the browser zone. Browser storage access errors propagate.
 * refs: none
 * I/O types: `none -> string`.
 */
export function getPreferredTimeZone(): string {
  if (typeof window === "undefined") return FALLBACK_TIME_ZONE;
  const stored = localStorage.getItem(TIME_ZONE_STORAGE_KEY);
  return isValidTimeZone(stored) ? stored : browserTimeZone();
}

/**
 * Updates preferred time zone using the module's persistence or validation rules.
 * refs: none
 * I/O types: `timeZone: string -> void`.
 */
export function savePreferredTimeZone(timeZone: string): void {
  if (typeof window !== "undefined" && isValidTimeZone(timeZone)) {
    localStorage.setItem(TIME_ZONE_STORAGE_KEY, timeZone);
  }
}

/**
 * Return sorted unique Intl-supported time zones including UTC, or the configured fallback zone list when supportedValuesOf is unavailable.
 * refs: none
 * I/O types: `none -> string[]`.
 */
export function getSupportedTimeZones(): string[] {
  const supported = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"];
  return Array.from(new Set(["UTC", ...supported])).sort();
}

/**
 * Map supported fixed-offset minutes to string values and formatted UTC labels for selection controls.
 * refs: none
 * I/O types: `none -> Array<{ value: string; label: string }>`.
 */
export function getFixedUtcOffsetOptions(): Array<{ value: string; label: string }> {
  return FIXED_UTC_OFFSET_MINUTES.map((minutes) => ({
    value: String(minutes),
    label: formatUtcOffset(minutes),
  }));
}

/**
 * Format zero minutes as UTC and other signed minute offsets as plus/minus HH:MM; the caller supplies a valid minute offset.
 * refs: none
 * I/O types: `minutes: number -> string`.
 */
export function fixedUtcOffsetToTimeZone(minutes: number): string {
  if (minutes === 0) return "UTC";
  const sign = minutes < 0 ? "-" : "+";
  const absolute = Math.abs(minutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function formatUtcOffset(minutes: number): string {
  if (minutes === 0) return "UTC±00:00";
  const sign = minutes < 0 ? "−" : "+";
  const absolute = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

/**
 * Convert UTC to string zero or a signed HH:MM offset to signed minutes; return an empty string when the value does not match that format.
 * refs: none
 * I/O types: `timeZone: string -> string`.
 */
export function fixedUtcOffsetFromTimeZone(timeZone: string): string {
  if (timeZone === "UTC") return "0";
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  if (!match) return "";
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return String(match[1] === "-" ? -minutes : minutes);
}
