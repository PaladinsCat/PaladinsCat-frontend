import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.winRate.title", {
    descriptionKey: "seo.stats.winRate.description",
    metadata: { alternates: { canonical: "/stats/winrate" } },
  });
}

export default function WinrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
