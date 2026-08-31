/**
 * Compose metadata and child content for matches layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for matches layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.matches.title", {
    descriptionKey: "seo.matches.description",
    metadata: { alternates: { canonical: "/matches" } },
  });
}

/**
 * Render the MatchesLayout view for matches layout.
 * Return the React tree for the declared inputs and page data.
 */
export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
