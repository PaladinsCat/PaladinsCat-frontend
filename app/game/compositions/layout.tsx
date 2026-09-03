/**
 * Compose metadata and child content for game compositions layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for game compositions layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.game.compositions.title", {
    descriptionKey: "seo.game.compositions.description",
    metadata: { alternates: { canonical: "/game/compositions" } },
  });
}

/**
 * Render the TeamCompositionsLayout view for game compositions layout.
 * Returns: `React.JSX.Element`
 * Return the React tree for the declared inputs and page data.
 * refs: none
 */
export default function TeamCompositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
