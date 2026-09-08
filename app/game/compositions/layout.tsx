/**
 * Compose metadata and child content for game compositions layout.
 * Keep SEO and nesting behavior local to this layout.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for game compositions layout.
 * Return the Next.js metadata object used by the page without mutating application data.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.game.compositions.title", {
    descriptionKey: "seo.game.compositions.description",
    metadata: { alternates: { canonical: "/game/compositions" } },
  });
}

/**
 * Pass the /game/compositions layout children through unchanged.
 * Render the TeamCompositionsLayout view for game compositions layout.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function TeamCompositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
