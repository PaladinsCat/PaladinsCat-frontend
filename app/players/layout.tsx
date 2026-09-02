/**
 * Define the player route surface for layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player layout route.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.title", {
    descriptionKey: "seo.players.description",
  });
}

/**
 * Render the layout for the player layout route.
 * Returns: `React.JSX.Element`
 */
export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
