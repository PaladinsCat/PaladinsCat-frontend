/**
 * Define the stats activity clean page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { permanentRedirect } from "next/navigation";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 */
export default function CleanPlayerActivityPage() {
  permanentRedirect("/stats/activity");
}
