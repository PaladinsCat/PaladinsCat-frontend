/**
 * Define the loading responsibility boundary.
 * Coordinates loading data loading, authorization, and presentation.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function Loading() {
  return <RouteSkeleton variant="dashboard" />;
}
