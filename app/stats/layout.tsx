import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Stats, Ranked Data, Meta Trends & Tier Distribution",
  description:
    "Explore Paladins ranked stats: champion win rates, ban rates, DPM, HPM, GPM, KDA, tier distribution, item stats, map stats, and player data.",
  alternates: {
    canonical: "/stats",
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
