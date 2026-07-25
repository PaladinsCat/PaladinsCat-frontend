import PlayerActivityDetails from "@/components/player-activity-details";
import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("playerActivity.detailsTitle", {
    descriptionKey: "playerActivity.detailsDescription",
    metadata: { alternates: { canonical: "/stats/activity/details" } },
  });
}

export default function PlayerActivityDetailsPage() {
  return <PlayerActivityDetails />;
}
