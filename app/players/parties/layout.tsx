/**
 * Define the player route surface for parties layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player parties layout route.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.parties.title", {
    descriptionKey: "seo.players.parties.description",
    metadata: { alternates: { canonical: "/players/parties" } },
  });
}

/**
 * Render the layout for the player parties layout route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function RankedPartiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
