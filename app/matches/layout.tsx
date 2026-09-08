/**
 * Compose metadata and child content for matches layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for matches layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.matches.title", {
    descriptionKey: "seo.matches.description",
    metadata: { alternates: { canonical: "/matches" } },
  });
}

/**
 * Pass the /matches layout children through unchanged.
 * Render the MatchesLayout view for matches layout.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
