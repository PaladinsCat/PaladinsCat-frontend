/**
 * Define the player route surface for support-diff page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import PerformanceDiffDirectory from "@/components/performance-diff-directory";

/**
 * Render the SupportDiffPage view for the player support-diff page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function SupportDiffPage() {
  return <PerformanceDiffDirectory metric="support-diff" />;
}
