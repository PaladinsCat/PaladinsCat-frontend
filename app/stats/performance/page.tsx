/**
 * Render the /stats/performance route with `MetricsPage`.
 * refs: none
 */
import { mapPerformanceDashboardPageData } from "@/lib/api-client";
import { fetchAccountServerJson } from "@/lib/server-api";
import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";
import { performanceSelection, type GamePerformanceMetric, type PerformanceScope } from "@/lib/performance-selection";
import MetricsPage, { type MetricsInitialData } from "../metrics/page";

type RawRecord = Record<string, unknown>;

async function getInitialData(scope: PerformanceScope, metric: GamePerformanceMetric, queueId: number): Promise<MetricsInitialData | null> {
  try {
    const dashboard = await fetchAccountServerJson<RawRecord>(`/stats/performance-metrics?metric=${metric}&includeRoles=1&scope=${scope}&queueId=${queueId}`, { timeoutMs: 900 });
    return mapPerformanceDashboardPageData(dashboard, scope, metric, queueId);
  } catch (error) {
    console.error("[stats/performance] Server page-data fetch failed; using bounded browser fallback", error);
    return null;
  }
}

/**
 * Force request-time rendering for this route instead of static caching.
 * refs: none
 */
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ scope?: string; metric?: string; queueId?: string }> };

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
  const { scope, metric, queueId } = performanceSelection(params.scope, params.metric, params.queueId);
  return <MetricsPage initialData={await getInitialData(scope, metric, queueId)} />;
}
