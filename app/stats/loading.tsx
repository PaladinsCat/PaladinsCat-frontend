/**
 * Render /stats using `RouteSkeleton`.
 * refs: none
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render /stats using `RouteSkeleton`.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function Loading() {
  return <RouteSkeleton variant="dashboard" />;
}
