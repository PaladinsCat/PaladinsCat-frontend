import { createLocalizedMetadata } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("seo.players.performance.title", {
    descriptionKey: "seo.players.performance.description",
    metadata: { alternates: { canonical: "/players/performance" } },
  });
}

export default function PlayerPerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
