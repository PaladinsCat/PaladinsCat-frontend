import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins KDA Stats — Champion Performance Rankings",
  description:
    "View Paladins KDA stats by champion and class with global rank, class rank, match counts, and comparisons against global averages.",
  alternates: {
    canonical: "/stats/kda",
  },
};

export default function KdaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
