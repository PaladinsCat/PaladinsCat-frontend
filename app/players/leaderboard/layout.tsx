import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.leaderboard.title", {
    descriptionKey: "seo.players.leaderboard.description",
    metadata: { alternates: { canonical: "/players/leaderboard" } },
  });
}

export default function PlayerLeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
