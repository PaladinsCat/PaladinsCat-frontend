/**
 * Render the /stats/performance route with `MetricsPage`.
 * refs: none
 */
import type { PerformanceMetricSummary } from "@/lib/api-client";
import { fetchServerJson } from "@/lib/server-api";
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";
import { performanceSelection, type GamePerformanceMetric, type PerformanceScope } from "@/lib/performance-selection";
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

async function getInitialData(scope: PerformanceScope, metric: GamePerformanceMetric): Promise<MetricsInitialData | null> {
  try {
    const dashboardRaw = await fetchServerJson<RawRecord>(`/stats/performance-metrics?metric=${metric}&scope=${scope}&includeRoles=1`, { timeoutMs: 5000 });
    const dashboard = unwrapRecord(dashboardRaw);
    if (!dashboard[metric] || (dashboard.scope && dashboard.scope !== scope)) return null;
    const roles = dashboard.roles && typeof dashboard.roles === "object" && !Array.isArray(dashboard.roles)
      ? Object.fromEntries(Object.entries(dashboard.roles).map(([role, summary]) => [role, mapSummary(summary)]))
      : {};
    return {
      scope,
      metric,
      dashboard: { summary: mapSummary(dashboard[metric]), roles },
    };
  } catch (error) {
    console.error("[stats/performance] Server metric fetch failed; using browser fallback", error);
    return null;
  }
}

/**
 * Force request-time rendering for this route instead of static caching.
 * refs: none
 */
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ scope?: string; metric?: string }> };

/**
 * Build localized metadata for /stats/performance, including the title and any canonical, description, and crawler directives configured for this route.
 * I/O types: `{ searchParams }: PageProps -> Promise<Metadata>`.
 * refs: none
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { scope } = performanceSelection((await searchParams).scope);
  const { t } = await getServerLocalization();
  const title = t(scope === "casual" ? "seo.stats.performance.casualTitle" : "seo.stats.performance.rankedTitle");
  const description = t(scope === "casual" ? "stats.performance.casualDescription" : "stats.performance.rankedDescription");
  const canonical = scope === "casual" ? "/stats/performance?scope=casual" : "/stats/performance";
  const images = ["/images/icons/paladinscat.avif"];
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "PaladinsCat", type: "website", images },
    twitter: { card: "summary", title, description, images },
  };
}

/**
 * Render the /stats/performance route with `MetricsPage`.
 * I/O types: `{ searchParams }: PageProps -> Promise<JSX.Element>`.
 * refs: none
 */
export default async function PerformancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { scope, metric } = performanceSelection(params.scope, params.metric);
  return <MetricsPage initialData={await getInitialData(scope, metric)} />;
}
