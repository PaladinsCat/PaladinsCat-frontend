/**
 * Define the account loading responsibility boundary.
 * Coordinates account loading data loading, authorization, and presentation.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function Loading() {
  return <RouteSkeleton variant="detail" />;
}
