/**
 * Pass the /stats/maps layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/maps.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.maps.title", {
    descriptionKey: "seo.stats.maps.description",
    metadata: { alternates: { canonical: "/stats/maps" } },
  });
}

/**
 * Pass the /stats/maps layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
