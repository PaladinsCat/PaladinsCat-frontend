/**
 * Provide the loading fallback for builds id loading.
 * Render the temporary React tree shown while content resolves.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading fallback for builds id loading.
 * Return the temporary React tree shown while page content resolves.
 * Returns: `React.JSX.Element`
 */
export default function Loading() {
  return <RouteSkeleton variant="detail" />;
}
