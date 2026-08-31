/**
 * Define the player route surface for hall-of-fame page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import CommunityVoteLeaderboard from "@/components/CommunityVoteLeaderboard";

/**
 * Render the HallOfFamePage view for the player hall-of-fame page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function HallOfFamePage() {
  return <CommunityVoteLeaderboard kind="hall_of_fame" />;
}
