/**
 * Provide the loading fallback for champions name loading.
 * Render the temporary React tree shown while content resolves.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Render the loading fallback for champions name loading.
 * Return the temporary React tree shown while page content resolves.
 */
export default function Loading() {
  return <RouteSkeleton variant="detail" />;
}
