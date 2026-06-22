import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins MPM Stats — Shielding and Mitigation Data",
  description:
    "Compare Paladins mitigation per minute stats by champion and class, including global rank, class rank, match counts, and frontline benchmarks.",
  alternates: {
    canonical: "/stats/mpm",
  },
};

export default function MpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
