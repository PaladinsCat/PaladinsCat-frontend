/**
 * Pass the /stats/activity layout children through unchanged.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/activity.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.activity.title", {
    descriptionKey: "seo.stats.activity.description",
    metadata: { alternates: { canonical: "/stats/activity" } },
  });
}

/**
 * Pass the /stats/activity layout children through unchanged.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function PlayerActivityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
