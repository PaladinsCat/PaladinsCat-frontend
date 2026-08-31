/**
 * Define the player route surface for weirdos page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import CommunityVoteLeaderboard from "@/components/CommunityVoteLeaderboard";

/**
 * Render the WeirdosPage view for the player weirdos page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function WeirdosPage() {
  return <CommunityVoteLeaderboard kind="weirdo" />;
}
