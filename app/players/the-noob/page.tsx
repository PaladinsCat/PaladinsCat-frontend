/**
 * Define the player route surface for the-noob page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import PerformanceDiffDirectory from "@/components/performance-diff-directory";

/**
 * Render the TheNoobPage view for the player the-noob page route.
 * Returns: `React.JSX.Element`
 */
export default function TheNoobPage() {
  return <PerformanceDiffDirectory metric="the-noob" />;
}
