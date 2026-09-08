/**
 * Pass the /tierlists/[id] layout children through unchanged; route metadata is configured separately.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build localized metadata for /tierlists/[id], including the title and any canonical, description, and crawler directives configured for this route.
 * refs: none
 * I/O types: `{ params }: { params: Promise<{ id: string }> } -> Promise<Metadata>`.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createLocalizedMetadata("seo.tierLists.title", {
    descriptionKey: "seo.tierLists.description",
    metadata: { alternates: { canonical: `/tierlists/${encodeURIComponent(id)}` } },
  });
}

/**
 * Pass the /tierlists/[id] layout children through unchanged; route metadata is configured separately.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function TierListDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
