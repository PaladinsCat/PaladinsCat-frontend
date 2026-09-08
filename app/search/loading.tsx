/**
 * Provide the loading fallback for search loading.
 * Render the temporary React tree shown while content resolves.
 * refs: none
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading fallback for search loading.
 * Return the temporary React tree shown while page content resolves.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function Loading() {
  return <RouteSkeleton variant="list" />;
}
