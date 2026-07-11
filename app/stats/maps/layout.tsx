import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Ranked Map Stats — Distribution and Match Counts",
  description: "Explore ranked Paladins map distribution, match counts, champion drafts, talents, and item choices.",
  alternates: { canonical: "/stats/maps" },
};

export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
