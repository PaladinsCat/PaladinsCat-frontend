import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Champion Stats, Win Rates, Ban Rates & Meta Data",
  description:
    "Compare Paladins champion stats, ranked win rates, ban rates, pick rates, roles, talents, cards, and meta trends.",
  alternates: {
    canonical: "/champions",
  },
};

export default function ChampionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
