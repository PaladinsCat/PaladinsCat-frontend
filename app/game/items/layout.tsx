/**
 * Compose metadata and child content for game items layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for game items layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.items.title", {
    descriptionKey: "seo.stats.items.description",
    metadata: { alternates: { canonical: "/game/items" } },
  });
}

/**
 * Pass the /game/items layout children through unchanged.
 * Render the GameItemsLayout view for game items layout.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function GameItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
