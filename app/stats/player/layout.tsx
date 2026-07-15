import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.player.title", {
    metadata: { robots: { index: false, follow: true } },
  });
}

export default function PlayerStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
