/**
 * Compose metadata and child content for champions layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for champions layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.champions.title", {
    descriptionKey: "seo.champions.description",
    metadata: { alternates: { canonical: "/champions" } },
  });
}

/**
 * Render the ChampionsLayout view for champions layout.
 * Return the React tree for the declared inputs and page data.
 */
export default function ChampionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
