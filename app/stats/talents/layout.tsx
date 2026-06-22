import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Talent Stats — Ranked Talent Win Rates",
  description:
    "Compare Paladins talent stats, ranked talent pick rates, win rates, champion usage, and meta trends.",
  alternates: {
    canonical: "/stats/talents",
  },
};

export default function TalentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
