/**
 * Pass the /stats/metrics layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/metrics.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.metrics.title", {
    descriptionKey: "seo.stats.metrics.description",
    metadata: { alternates: { canonical: "/stats/metrics" } },
  });
}

/**
 * Pass the /stats/metrics layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function MetricsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
