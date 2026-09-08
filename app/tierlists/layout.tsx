/**
 * Pass the /tierlists layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /tierlists, including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: "/tierlists" } },
  });
}

/**
 * Pass the /tierlists layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function TierListsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
