const HAS_EXPLICIT_TIME_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const SQL_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/;

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

export function formatLocalDateTime(value: string | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatLocalDate(value: string | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

export function formatLocalMonthDay(value: string | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatLocalHourFromUtcBucket(date: string | null | undefined, hour: number | null | undefined): string {
  if (!date || hour == null || !Number.isFinite(hour)) return "-";
  const [year, month, day] = date.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return "-";
  const localDate = new Date(Date.UTC(year, month - 1, day, Math.floor(hour), 0, 0));
  return localDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
