import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranked Paladins Parties",
  description: "Browse exact ranked Paladins stacks of two to five players and every canonical pair produced by those parties.",
  alternates: { canonical: "/players/parties" },
};

export default function RankedPartiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
