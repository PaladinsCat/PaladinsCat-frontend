/**
 * Define the player route surface for leaderboard layout and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Build SEO metadata for the player leaderboard layout route.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.leaderboard.title", {
    descriptionKey: "seo.players.leaderboard.description",
    metadata: { alternates: { canonical: "/players/leaderboard" } },
  });
}

/**
 * Render the layout for the player leaderboard layout route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PlayerLeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
