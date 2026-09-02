/**
 * Define the stats loading route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { RouteSkeleton } from "@/components/route-skeleton";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 */
export default function Loading() {
  return <RouteSkeleton variant="dashboard" />;
}
