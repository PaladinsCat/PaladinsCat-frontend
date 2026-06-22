import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins HPM Stats — Healing Per Minute Leaderboards",
  description:
    "Compare Paladins healing per minute stats by champion and class, including global rank, class rank, match counts, and average healing benchmarks.",
  alternates: {
    canonical: "/stats/hpm",
  },
};

export default function HpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
