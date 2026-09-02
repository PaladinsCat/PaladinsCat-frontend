/**
 * Define the stats winrate layout route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
import { createLocalizedMetadata } from "@/lib/server-localization";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata() {
  return createLocalizedMetadata("seo.stats.winRate.title", {
    descriptionKey: "seo.stats.winRate.description",
    metadata: { alternates: { canonical: "/stats/winrate" } },
  });
}

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function WinrateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
