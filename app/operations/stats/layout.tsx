/**
 * Pass the /operations/stats layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /operations/stats, including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.operations.title", {
    descriptionKey: "seo.operations.description",
    metadata: { alternates: { canonical: "/operations/stats" } },
  });
}

/**
 * Pass the /operations/stats layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function OperationsStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
