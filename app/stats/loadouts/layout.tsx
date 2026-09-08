/**
 * Pass the /stats/loadouts layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/loadouts.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.loadouts.title", {
    descriptionKey: "seo.stats.loadouts.description",
    metadata: { alternates: { canonical: "/stats/loadouts" } },
  });
}

/**
 * Pass the /stats/loadouts layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function LoadoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
