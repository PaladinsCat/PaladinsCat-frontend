import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Ranked Leaderboard — Top Players and Stats",
  description:
    "View Paladins ranked leaderboards with top players, account stats, match counts, champion performance, and competitive rankings.",
  alternates: {
    canonical: "/players/leaderboard",
  },
};

export default function PlayerLeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
