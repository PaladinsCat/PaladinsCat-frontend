import PlayerActivityPanel from "@/components/player-activity-panel";
import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.activity.title", {
    descriptionKey: "seo.stats.activity.description",
    metadata: { alternates: { canonical: "/stats/activity/clean" } },
  });
}

export default function CleanPlayerActivityPage() {
  return <div className="pc-player-activity-clean-page">
    <PlayerActivityPanel showStatements={false} />
  </div>;
}
