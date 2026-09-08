/**
 * Pass the /stats/banrate layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/banrate.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.banRate.title", {
    descriptionKey: "seo.stats.banRate.description",
    metadata: { alternates: { canonical: "/stats/banrate" } },
  });
}

/**
 * Pass the /stats/banrate layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function BanrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
