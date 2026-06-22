import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Match History, Ranked Activity and Match Stats",
  description:
    "Browse Paladins ranked match activity, match history, dropped match tracking, player stats, champion picks, bans, items, cards, and results.",
  alternates: {
    canonical: "/matches",
  },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
