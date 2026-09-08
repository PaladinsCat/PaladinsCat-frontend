/**
 * Render the loading state for the player id loading view.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading state for the player id loading view.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function Loading() {
  return <RouteSkeleton variant="profile" />;
}
