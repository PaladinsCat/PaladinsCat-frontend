import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Ranked Tier Distribution and Playerbase Stats",
  description:
    "See Paladins ranked tier distribution, player profile counts, active match tier distribution, average match tier, and Grandmaster/Master population data.",
  alternates: {
    canonical: "/stats/tiers",
  },
};

export default function TiersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
