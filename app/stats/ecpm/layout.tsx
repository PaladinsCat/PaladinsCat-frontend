/**
 * Pass the /stats/ecpm layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/ecpm.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.egpm.title", {
    descriptionKey: "seo.stats.egpm.description",
    metadata: { alternates: { canonical: "/stats/ecpm" } },
  });
}

/**
 * Pass the /stats/ecpm layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function EcpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
