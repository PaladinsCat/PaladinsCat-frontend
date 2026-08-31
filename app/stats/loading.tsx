/**
 * Define the stats loading route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function Loading() {
  return <RouteSkeleton variant="dashboard" />;
}
