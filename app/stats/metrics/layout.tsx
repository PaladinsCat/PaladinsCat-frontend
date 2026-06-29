import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Performance Metrics — Champion Stats by Class",
  description:
    "Compare champion performance across damage, healing, credits, mitigation, and KDA metrics with class breakdowns and percentile distributions.",
  alternates: {
    canonical: "/stats/metrics",
  },
};

export default function MetricsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
