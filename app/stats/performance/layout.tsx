/**
 * Pass the /stats/performance layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/performance.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.metrics.title", {
    descriptionKey: "seo.stats.metrics.description",
    metadata: { alternates: { canonical: "/stats/performance" } },
  });
}

/**
 * Pass the /stats/performance layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
