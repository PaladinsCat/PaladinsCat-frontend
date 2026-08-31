/**
 * Define the player route surface for support-diff page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import PerformanceDiffDirectory from "@/components/performance-diff-directory";

/**
 * Render the SupportDiffPage view for the player support-diff page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function SupportDiffPage() {
  return <PerformanceDiffDirectory metric="support-diff" />;
}
