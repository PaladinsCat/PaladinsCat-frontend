/**
 * Define the player route surface for hypercarry page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import PerformanceDiffDirectory from "@/components/performance-diff-directory";

/**
 * Render the HypercarryPage view for the player hypercarry page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function HypercarryPage() {
  return <PerformanceDiffDirectory metric="hypercarry" />;
}
