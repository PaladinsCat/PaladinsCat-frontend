import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins Ban Rate Stats — Ranked Champion Meta",
  description:
    "Compare Paladins ranked ban rates by champion and class with global rank, class rank, match counts, and meta pressure indicators.",
  alternates: {
    canonical: "/stats/banrate",
  },
};

export default function BanrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
