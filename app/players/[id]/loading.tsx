/**
 * Define the player route surface for id loading and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading state for the player id loading view.
 * Returns: `React.JSX.Element`
 */
export default function Loading() {
  return <RouteSkeleton variant="profile" />;
}
