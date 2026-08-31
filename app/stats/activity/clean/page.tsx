/**
 * Define the stats activity clean page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { permanentRedirect } from "next/navigation";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function CleanPlayerActivityPage() {
  permanentRedirect("/stats/activity");
}
