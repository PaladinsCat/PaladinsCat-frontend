import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Player Stats, Ranked Leaderboards and ELO",
  description:
    "Search Paladins player profiles, ranked stats, account ELO, champion averages, leaderboards, match history, and performance data.",
  alternates: {
    canonical: "/players",
  },
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
