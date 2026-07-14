import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranked Paladins Party Pairs",
  description: "Browse ranked Paladins teammates observed sharing a party, with linked profiles and their match history together.",
  alternates: { canonical: "/players/parties" },
};

export default function PartyPairsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
