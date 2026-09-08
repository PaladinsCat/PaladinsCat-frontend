/**
 * Pass the /stats/egpm layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/egpm.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.egpm.title", {
    descriptionKey: "seo.stats.egpm.description",
    metadata: { alternates: { canonical: "/stats/egpm" } },
  });
}

/**
 * Pass the /stats/egpm layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function EgpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
