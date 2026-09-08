/**
 * Pass the /stats/tiers layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/tiers.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.tiers.title", {
    descriptionKey: "seo.stats.tiers.description",
    metadata: { alternates: { canonical: "/stats/tiers" } },
  });
}

/**
 * Pass the /stats/tiers layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function TiersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
