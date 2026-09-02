/**
 * Define the player route surface for tank-diff page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import PerformanceDiffDirectory from "@/components/performance-diff-directory";

/**
 * Render the TankDiffPage view for the player tank-diff page route.
 * Returns: `React.JSX.Element`
 */
export default function TankDiffPage() {
  return <PerformanceDiffDirectory metric="tank-diff" />;
}
