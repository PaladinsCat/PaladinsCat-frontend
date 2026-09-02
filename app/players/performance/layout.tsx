/**
 * Define the player route surface for performance layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player performance layout route.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.performance.title", {
    descriptionKey: "seo.players.performance.description",
    metadata: { alternates: { canonical: "/players/performance" } },
  });
}

/**
 * Render the layout for the player performance layout route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PlayerPerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
