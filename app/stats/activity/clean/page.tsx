/**
 * Define the stats activity clean page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
import { permanentRedirect } from "next/navigation";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function CleanPlayerActivityPage() {
  permanentRedirect("/stats/activity");
}
