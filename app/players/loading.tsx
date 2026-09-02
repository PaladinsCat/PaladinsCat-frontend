/**
 * Define the player route surface for loading and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading state for the player loading view.
 * Returns: `React.JSX.Element`
 */
export default function Loading() {
  return <RouteSkeleton variant="dashboard" />;
}
