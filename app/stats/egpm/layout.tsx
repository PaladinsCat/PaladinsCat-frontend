import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paladins eCPM Distribution — Global and Role Baselines",
  description: "Explore effective credits per minute averages and percentile distributions globally and by Paladins role.",
  alternates: { canonical: "/stats/egpm" },
};

export default function EgpmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
