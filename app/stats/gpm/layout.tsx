import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins GPM Stats — Credits Per Minute Leaderboards",
  description:
    "Analyze Paladins credits per minute stats by champion and class with global rank, class rank, match counts, and economy benchmarks.",
  alternates: {
    canonical: "/stats/gpm",
  },
};

export default function GpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
