/**
 * Define the player route surface for dps-diff page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import PerformanceDiffDirectory from "@/components/performance-diff-directory";

/**
 * Render the DpsDiffPage view for the player dps-diff page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function DpsDiffPage() {
  return <PerformanceDiffDirectory metric="dps-diff" />;
}
