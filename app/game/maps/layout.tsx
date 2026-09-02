/**
 * Compose metadata and child content for game maps layout.
 * Keep SEO and nesting behavior local to this layout.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for game maps layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.maps.title", {
    descriptionKey: "seo.stats.maps.description",
    metadata: { alternates: { canonical: "/game/maps" } },
  });
}

/**
 * Render the GameMapsLayout view for game maps layout.
 * Returns: `React.JSX.Element`
 * Return the React tree for the declared inputs and page data.
 */
export default function GameMapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
