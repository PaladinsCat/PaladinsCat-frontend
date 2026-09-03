/**
 * Compose metadata and child content for champions layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for champions layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.champions.title", {
    descriptionKey: "seo.champions.description",
    metadata: { alternates: { canonical: "/champions" } },
  });
}

/**
 * Render the ChampionsLayout view for champions layout.
 * Returns: `React.JSX.Element`
 * Return the React tree for the declared inputs and page data.
 * refs: none
 */
export default function ChampionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
