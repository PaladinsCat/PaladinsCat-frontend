/**
 * Render /stats/activity/details using `PlayerActivityDetails`.
 * refs: none
 */
import PlayerActivityDetails from "@/components/player-activity-details";
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Render /stats/activity/details.
 * refs: none
 * I/O types: `none -> Promise<Metadata>`.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("playerActivity.detailsTitle", {
    descriptionKey: "playerActivity.detailsDescription",
    metadata: { alternates: { canonical: "/stats/activity/details" } },
  });
}

/**
 * Render /stats/activity/details using `PlayerActivityDetails`.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function PlayerActivityDetailsPage() {
  return (
    <PlayerActivityDetails />);
}
