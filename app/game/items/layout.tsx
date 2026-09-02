/**
 * Compose metadata and child content for game items layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for game items layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.items.title", {
    descriptionKey: "seo.stats.items.description",
    metadata: { alternates: { canonical: "/game/items" } },
  });
}

/**
 * Render the GameItemsLayout view for game items layout.
 * Returns: `React.JSX.Element`
 * Return the React tree for the declared inputs and page data.
 */
export default function GameItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
