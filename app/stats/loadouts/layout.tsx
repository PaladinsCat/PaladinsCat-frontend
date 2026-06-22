import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Loadout Stats — Cards, Builds and Ranked Data",
  description:
    "Analyze Paladins loadout stats, card usage, build trends, champion cards, ranked win rates, and competitive build data.",
  alternates: {
    canonical: "/stats/loadouts",
  },
};

export default function LoadoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
