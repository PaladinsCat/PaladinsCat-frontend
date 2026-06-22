import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Charts",
  robots: {
    index: false,
    follow: true,
  },
};

export default function PlayerStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
