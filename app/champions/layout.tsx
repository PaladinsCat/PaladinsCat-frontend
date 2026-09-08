/**
 * Compose metadata and child content for champions layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for champions layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.champions.title", {
    descriptionKey: "seo.champions.description",
    metadata: { alternates: { canonical: "/champions" } },
  });
}

/**
 * Pass the /champions layout children through unchanged.
 * Render the ChampionsLayout view for champions layout.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function ChampionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
