/**
 * Pass the /stats/winrate layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/winrate.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.winRate.title", {
    descriptionKey: "seo.stats.winRate.description",
    metadata: { alternates: { canonical: "/stats/winrate" } },
  });
}

/**
 * Pass the /stats/winrate layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function WinrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
