import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins DPM Stats — Damage Per Minute Leaderboards",
  description:
    "Rank Paladins champions by damage per minute with class rank, global rank, match counts, and comparisons against class and global averages.",
  alternates: {
    canonical: "/stats/dpm",
  },
};

export default function DpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
