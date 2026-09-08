/**
 * Pass the /stats/player layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/player.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.player.title", {
    metadata: { robots: { index: false, follow: true } },
  });
}

/**
 * Pass the /stats/player layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function PlayerStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
