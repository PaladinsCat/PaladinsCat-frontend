import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Win Rate Stats — Champion and Class Rankings",
  description:
    "Track Paladins champion win rates by class and global rank with match counts, ranked data, and comparisons against class and global averages.",
  alternates: {
    canonical: "/stats/winrate",
  },
};

export default function WinrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
