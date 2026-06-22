import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins ELO Leaderboard — Account Ratings and Ranked Data",
  description:
    "Track Paladins account ELO ratings, Glicko-2 leaderboards, ranked match counts, wins, losses, and player performance.",
  alternates: {
    canonical: "/players/elo",
  },
};

export default function PlayerEloLayout({ children }: { children: React.ReactNode }) {
  return children;
}
