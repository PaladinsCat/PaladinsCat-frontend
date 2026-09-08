/**
 * Pass the /stats/talents layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/talents.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.talents.title", {
    descriptionKey: "seo.stats.talents.description",
    metadata: { alternates: { canonical: "/stats/talents" } },
  });
}

/**
 * Pass the /stats/talents layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function TalentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
