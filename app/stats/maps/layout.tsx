import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Ranked Map Stats — Win Rates and Match Counts",
  description: "Explore ranked Paladins map statistics, including team-side win rates, wins, losses, and match counts.",
  alternates: { canonical: "/stats/maps" },
};

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
