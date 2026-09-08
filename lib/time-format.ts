/**
 * Defines time-format's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 * refs: none
 */
import { getPreferredTimeZone } from "@/lib/time-zone";

const HAS_EXPLICIT_TIME_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const SQL_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/;

/**
 * Return null for blank or invalid dates. Treat SQL-format timestamps without an explicit zone as UTC by replacing the space with T and appending Z, then parse other date strings as supplied.
 * refs: none
 * I/O types: `value: string | null | undefined -> Date | null`.
 */
export function parseBackendDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = SQL_TIMESTAMP.test(trimmed) && !HAS_EXPLICIT_TIME_ZONE.test(trimmed)
    ? trimmed.replace(" ", "T") + "Z"
    : trimmed;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a valid backend timestamp with medium date and short time in the preferred time zone; return a hyphen for invalid input.
 * refs: none
 * I/O types: `value: string | null | undefined; locale?: string -> string`.
 */
export function formatLocalDateTime(value: string | null | undefined, locale?: string): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: getPreferredTimeZone(),
  });
}

/**
 * Format a valid backend timestamp as a medium date in the preferred time zone; return a hyphen for invalid input.
 * refs: none
 * I/O types: `value: string | null | undefined; locale?: string -> string`.
 */
export function formatLocalDate(value: string | null | undefined, locale?: string): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleDateString(locale, {
    dateStyle: "medium",
    timeZone: getPreferredTimeZone(),
  });
}

/**
 * Format a valid backend timestamp as short month and numeric day in the preferred time zone; return a hyphen for invalid input.
 * refs: none
 * I/O types: `value: string | null | undefined; locale?: string -> string`.
 */
export function formatLocalMonthDay(value: string | null | undefined, locale?: string): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: getPreferredTimeZone(),
  });
}

/**
 * Build a UTC date from the date fields and floored finite hour, then format its hour/minute in the preferred time zone. Return a hyphen when date/hour fields are missing or invalid.
 * refs: none
 * I/O types: `date: string | null | undefined; hour: number | null | undefined; locale?: string -> string`.
 */
export function formatLocalHourFromUtcBucket(date: string | null | undefined, hour: number | null | undefined, locale?: string): string {
  if (!date || hour == null || !Number.isFinite(hour)) return "-";
  const [year, month, day] = date.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return "-";
  const localDate = new Date(Date.UTC(year, month - 1, day, Math.floor(hour), 0, 0));
  return localDate.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: getPreferredTimeZone(),
  });
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format valid timestamps less than seven days away using relative seconds/minutes/hours/days; use a preferred-zone calendar date for older or more distant values. Return a hyphen for invalid input.
 * refs: none
 * I/O types: `value: string | null | undefined; locale?: string -> string`.
 */
export function formatRelativeTime(value: string | null | undefined, locale?: string): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);

  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const direction = diff >= 0 ? -1 : 1;
  if (abs < MINUTE) return relative.format(0, "second");
  if (abs < HOUR) return relative.format(direction * Math.floor(abs / MINUTE), "minute");
  if (abs < DAY) return relative.format(direction * Math.floor(abs / HOUR), "hour");
  if (abs < 7 * DAY) return relative.format(direction * Math.floor(abs / DAY), "day");

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: getPreferredTimeZone(),
  });
}

/**
 * Format a valid backend timestamp as preferred-zone hour/minute plus time-zone name; return a hyphen for invalid input.
 * refs: none
 * I/O types: `value: string | null | undefined; locale?: string -> string`.
 */
export function formatLocalTime(value: string | null | undefined, locale?: string): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: getPreferredTimeZone(),
    timeZoneName: "short",
  });
}
