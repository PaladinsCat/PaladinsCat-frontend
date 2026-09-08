/**
 * Pass the /community/diminishing-returns layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /community/diminishing-returns, including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.community.diminishingReturns.title", {
    descriptionKey: "seo.community.diminishingReturns.description",
    metadata: { alternates: { canonical: "/community/diminishing-returns" } },
  });
}

/**
 * Pass the /community/diminishing-returns layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function DiminishingReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
