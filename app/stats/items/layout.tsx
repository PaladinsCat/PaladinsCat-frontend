/**
 * Pass the /stats/items layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/items.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.items.title", {
    descriptionKey: "seo.stats.items.description",
    metadata: { alternates: { canonical: "/stats/items" } },
  });
}

/**
 * Pass the /stats/items layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
