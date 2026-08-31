/**
 * Define the stats activity details page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import PlayerActivityDetails from "@/components/player-activity-details";
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("playerActivity.detailsTitle", {
    descriptionKey: "playerActivity.detailsDescription",
    metadata: { alternates: { canonical: "/stats/activity/details" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function PlayerActivityDetailsPage() {
  return (
    <PlayerActivityDetails />);
}
