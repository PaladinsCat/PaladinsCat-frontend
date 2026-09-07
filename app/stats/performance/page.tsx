/**
 * Define the stats performance page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
import type { ChampionPerformanceDistribution, PerformanceMetricSummary } from "@/lib/api-client";
import { fetchServerJson } from "@/lib/server-api";
import MetricsPage, { type MetricsInitialData } from "../metrics/page";

type RawRecord = Record<string, unknown>;

function mapSummary(raw: unknown): PerformanceMetricSummary {
  const value = raw && typeof raw === "object" ? raw as RawRecord : {};
  const number = (key: string) => Number(value[key] ?? 0);
  return {
    min: number("min"),
    max: number("max"),
    mean: number("mean"),
    median: number("median"),
    mode: number("mode"),
    p10: number("p10"),
    p25: number("p25"),
    p75: number("p75"),
    p90: number("p90"),
    sampleSize: Number(value.sample_size ?? value.sampleSize ?? 0),
  };
}

function unwrapRecord(raw: unknown): RawRecord {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const value = raw as RawRecord;
  return value.data && typeof value.data === "object" && !Array.isArray(value.data)
    ? value.data as RawRecord
    : value;
}

function unwrapRows(raw: unknown): RawRecord[] {
  if (Array.isArray(raw)) return raw.filter((row): row is RawRecord => Boolean(row) && typeof row === "object");
  const data = raw && typeof raw === "object" ? (raw as RawRecord).data : undefined;
  if (Array.isArray(data)) {
    return data.filter((row: unknown): row is RawRecord => Boolean(row) && typeof row === "object");
  }
  return [];
}

async function getInitialData(): Promise<MetricsInitialData | null> {
  try {
    const [dashboardRaw, rowsRaw] = await Promise.all([
      fetchServerJson<RawRecord>("/stats/performance-metrics?metric=dpm&includeRoles=1", { timeoutMs: 5000 }),
      fetchServerJson<unknown>("/stats/performance-metrics/by-champion?metric=dpm", { timeoutMs: 5000 }),
    ]);
    const dashboard = unwrapRecord(dashboardRaw);
    const roles = dashboard.roles && typeof dashboard.roles === "object" && !Array.isArray(dashboard.roles)
      ? Object.fromEntries(Object.entries(dashboard.roles).map(([role, summary]) => [role, mapSummary(summary)]))
      : {};
    const rows: ChampionPerformanceDistribution[] = unwrapRows(rowsRaw).map((row) => ({
      championId: Number(row.champion_id ?? 0),
      championName: String(row.champion_name ?? ""),
      className: String(row.class ?? "Unknown"),
      min: Number(row.min ?? 0),
      max: Number(row.max ?? 0),
      mean: Number(row.mean ?? 0),
      median: Number(row.median ?? 0),
      mode: Number(row.mode ?? 0),
      p10: Number(row.p10 ?? 0),
      p90: Number(row.p90 ?? 0),
      avgValue: Number(row.avg_value ?? 0),
      totalMatches: Number(row.total_matches ?? 0),
    }));
    return {
      metric: "dpm",
      dashboard: { summary: mapSummary(dashboard.dpm), roles },
      rows,
    };
  } catch (error) {
    console.error("[stats/performance] Server metric fetch failed; using browser fallback", error);
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  return <MetricsPage initialData={await getInitialData()} />;
}
