/**
 * Define the player route surface for master-feeding page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import MasterFeedingDirectory from "@/components/master-feeding-directory";

/**
 * Render the MasterFeedingPage view for the player master-feeding page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function MasterFeedingPage() {
  return <MasterFeedingDirectory />;
}
