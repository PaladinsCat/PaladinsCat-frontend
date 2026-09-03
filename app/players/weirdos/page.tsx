/**
 * Define the player route surface for weirdos page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import CommunityVoteLeaderboard from "@/components/CommunityVoteLeaderboard";

/**
 * Render the WeirdosPage view for the player weirdos page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function WeirdosPage() {
  return <CommunityVoteLeaderboard kind="weirdo" />;
}
