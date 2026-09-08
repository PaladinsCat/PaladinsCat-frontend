/**
 * Pass the /stats layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.title", {
    descriptionKey: "seo.stats.description",
    metadata: { alternates: { canonical: "/stats" } },
  });
}

/**
 * Pass the /stats layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
