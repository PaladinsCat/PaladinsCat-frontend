/**
 * Define the stats winrate layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.winRate.title", {
    descriptionKey: "seo.stats.winRate.description",
    metadata: { alternates: { canonical: "/stats/winrate" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function WinrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
