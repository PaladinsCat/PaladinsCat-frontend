/**
 * Define the stats activity details page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
import PlayerActivityDetails from "@/components/player-activity-details";
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("playerActivity.detailsTitle", {
    descriptionKey: "playerActivity.detailsDescription",
    metadata: { alternates: { canonical: "/stats/activity/details" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PlayerActivityDetailsPage() {
  return (
    <PlayerActivityDetails />);
}
