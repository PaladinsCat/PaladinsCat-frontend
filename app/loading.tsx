/**
 * Render the /loading route with `RouteSkeleton`.
 * refs: none
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the /loading route with `RouteSkeleton`.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function Loading() {
  return <RouteSkeleton variant="dashboard" />;
}
