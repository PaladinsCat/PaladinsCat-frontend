"use client";

export const TIME_ZONE_STORAGE_KEY = "pc_time_zone";
const FALLBACK_TIME_ZONE = "UTC";
const FIXED_UTC_OFFSET_MINUTES = [
  -720, -660, -600, -570, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60,
  0,
  60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 525, 540, 570,
  600, 630, 660, 690, 720, 765, 780, 840,
];

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

export function getPreferredTimeZone(): string {
  if (typeof window === "undefined") return FALLBACK_TIME_ZONE;
  const stored = localStorage.getItem(TIME_ZONE_STORAGE_KEY);
  return isValidTimeZone(stored) ? stored : browserTimeZone();
}

export function savePreferredTimeZone(timeZone: string): void {
  if (typeof window !== "undefined" && isValidTimeZone(timeZone)) {
    localStorage.setItem(TIME_ZONE_STORAGE_KEY, timeZone);
  }
}

export function getSupportedTimeZones(): string[] {
  const supported = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"];
  return Array.from(new Set(["UTC", ...supported])).sort();
}

export function getFixedUtcOffsetOptions(): Array<{ value: string; label: string }> {
  return FIXED_UTC_OFFSET_MINUTES.map((minutes) => ({
    value: String(minutes),
    label: formatUtcOffset(minutes),
  }));
}

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

export function fixedUtcOffsetFromTimeZone(timeZone: string): string {
  if (timeZone === "UTC") return "0";
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  if (!match) return "";
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return String(match[1] === "-" ? -minutes : minutes);
}
