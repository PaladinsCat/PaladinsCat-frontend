import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Item Stats — Pick Rates, Win Rates and Ranked Data",
  description:
    "Explore Paladins item stats with ranked pick rates, win rates, item categories, and match data for competitive builds.",
  alternates: {
    canonical: "/stats/items",
  },
};

export default function ItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
