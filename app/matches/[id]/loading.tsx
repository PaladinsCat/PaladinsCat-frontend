/**
 * Provide the loading fallback for matches id loading.
 * Render the temporary React tree shown while content resolves.
 * refs: none
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading fallback for matches id loading.
 * Return the temporary React tree shown while page content resolves.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function Loading() {
  return <RouteSkeleton variant="match" />;
}
